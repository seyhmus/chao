"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Dexie, { liveQuery } from "dexie";

import RequestNotifications from "@/components/Requests";
import api from "@/lib/api";
import {
  decrypt,
  decryptFile,
  deriveSharedSecret,
  exportKey,
  generateKeyPair,
  importKey,
} from "@/lib/crypto";
import {
  decompress,
  combine,
  base64ToBlob,
  base64ToArrayBuffer,
} from "@/lib/fileUtil";
import { auth } from "@/lib/firebase";
import { disconnectPusher, getPusherClient } from "@/lib/pusher";
import { MessageService } from "@/services/message";
import useWebRTC from "@/hooks/useWebRTC2";

const MessagingContext = createContext();

export const MessagingProvider = ({ children }) => {
  const router = useRouter();
  const [messageService, setMessageService] = useState(null);

  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [displayName, setDisplayName] = useState(null);

  const [users, setUsers] = useState({}); // lobby users aka presence users

  const [chatMessages, setChatMessages] = useState([]); // lobby messages
  const [requests, setRequests] = useState([]); // requests from other users

  const files = useRef(new Map());
  const privateKeys = useRef(new Map());

  // const messageQueue = useRef([]);
  // const isProcessingQueue = useRef(false);

  // // Process queued messages
  // const processMessageQueue = useCallback(async () => {
  //   if (isProcessingQueue.current || !messageService) return;

  //   isProcessingQueue.current = true;

  //   while (messageQueue.current.length > 0) {
  //     const message = messageQueue.current[0];
  //     try {
  //       console.log("processing message", message);
  //       await messageService.postSignal(message);
  //       messageQueue.current.shift(); // Remove processed message
  //     } catch (error) {
  //       console.error("Failed to process message:", error);
  //       break; // Stop processing on error
  //     }
  //   }

  //   isProcessingQueue.current = false;
  // }, [messageService]);

  // // Queue message and attempt to process
  // const queueMessage = useCallback(
  //   (message) => {
  //     messageQueue.current.push(message);
  //     processMessageQueue();
  //   },
  //   [processMessageQueue]
  // );

  const {
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    sendMessage,
    sendFile,
  } = useWebRTC({
    userId,
    onIceCandidate: useCallback(
      (peerId, candidate) => {
        queueMessage({
          receiverId: peerId,
          type: "ice-candidate",
          candidate,
        });
      },
      [messageService]
    ),
    onOffer: useCallback(
      (peerId, offer) => {
        queueMessage({
          receiverId: peerId,
          type: "offer",
          offer,
        });
      },
      [messageService]
    ),
    onAnswer: useCallback(
      (peerId, answer) => {
        queueMessage({
          receiverId: peerId,
          type: "answer",
          answer,
        });
      },
      [messageService]
    ),
    onMessage: useCallback(
      (peerId, data) => {
        let message = JSON.parse(data);
        const senderName = users[peerId]?.displayName ?? null;
        message = {
          ...message,
          senderId: peerId,
          senderName,
        };

        if (message.isSignal) {
          console.log("received signal", message);
          addSignal(message);
        } else if (message.chunk) {
          addFileChunk(message);
        } else {
          console.log("received conversation", message);
          addConversation(message);
        }
      },
      [users]
    ),
    onStateChange: useCallback(
      (peerId, state) => {
        if (state === "closed") {
          console.log("peer connection closed", peerId);
          queueMessage({
            receiverId: peerId,
            type: "close",
          });
        }
      },
      [messageService]
    ),
  });

  const addFileChunk = (data) => {
    const { senderId, index, totalChunks, hash, chunk, ...rest } = data;

    const key = `${senderId}-${hash}`;
    const chunks = files.current.get(key) || new Array(totalChunks).fill(null);
    chunks[index] = base64ToArrayBuffer(chunk);
    files.current.set(key, chunks);

    if (chunks.every((chunk) => chunk !== null)) {
      const blob = new Blob(chunks, { type: "application/octet-stream" });

      const message = {
        ...rest,
        senderId,
        blob,
        hash,
        totalChunks,
        receivedTime: Date.now(),
      };

      console.log("message", message);
      addConversation(message);

      // chunks completed for file: delete key
      files.current.delete(key);
    }
  };

  // CRYPTOGRAPHY /////////////////////////////////////////////////////////////////////////////

  // direct friendship request, triggers RequestNotifications component
  const requestFriendshipTo = async (peerId, peer = null) => {
    if (peerId === userId)
      throw new Error("You cannot add yourself as a friend");
    if (isFriend(peerId)) throw new Error("Already in your friends list");

    let { publicKey, privateKey } = await generateKeyPair();
    privateKeys.current.set(peerId, privateKey);
    const exportedPublicKey = await exportKey(publicKey);
    await messageService.postFriendRequest(peerId, exportedPublicKey);

    if (!peer) peer = await getUser(peerId);
    await db.friends.put(peer); // should trigger update to setFriends through live query, race condition?
  };

  // called by RequestNotifications component
  const acceptFriendship = async (request) => {
    const peerId = request.senderId;

    let { publicKey, privateKey } = await generateKeyPair();

    const importedPublicKey = await importKey(request.publicKey, "public");

    const sharedSecret = await deriveSharedSecret(
      privateKey,
      importedPublicKey
    );

    const exportedPublicKey = await exportKey(publicKey);
    await messageService.postFriendAccept(peerId, exportedPublicKey);

    const peer = {
      userId: peerId,
      displayName: request.senderName,
      photoURL: users[peerId]?.photoURL,
      email: users[peerId]?.email,
      sharedSecret: await exportKey(sharedSecret),
    };
    console.log("exported shared secret", peer.sharedSecret);

    await db.friends.put(peer); // should trigger update to setFriends through live query, race condition?
  };

  // the friend has accepted the request, we can update this info with the shared secret
  const handleAcceptedFriendship = async (data) => {
    const importedPublicKey = await importKey(data.publicKey, "public");
    const privateKey = privateKeys.current.get(data.senderId);
    const sharedSecret = await deriveSharedSecret(
      privateKey,
      importedPublicKey
    );
    privateKeys.current.delete(data.senderId); // delete as no longer needed

    const exportedSharedSecret = await exportKey(sharedSecret);
    console.log("exported shared secret", exportedSharedSecret);
    await db.friends.update(data.senderId, {
      sharedSecret: exportedSharedSecret,
    });
  };

  // DEXIE INDEX-DB ///////////////////////////////////////////////////////////////////////////
  const [db] = useState(() => {
    const dexieDb = new Dexie("securechat");
    dexieDb.version(1).stores({
      conversations: "++id, [senderId+timestamp], peerId",
      friends: "userId",
    });
    return dexieDb;
  });

  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState(new Map());
  const keys = useRef(new Map());

  useEffect(() => {
    const subscription = liveQuery(() => db.conversations.toArray()).subscribe(
      (dbConversations) => {
        setConversations(dbConversations);
      }
    );
    return () => subscription.unsubscribe();
  }, [db]);

  useEffect(() => {
    const subscription = liveQuery(() => db.friends.toArray()).subscribe(
      (dbFriends) => {
        setFriends(new Map(dbFriends.map((f) => [f.userId, f])));
      }
    );
    return () => subscription.unsubscribe();
  }, [db]);

  // const sharedSecret = friends.get(message.peerId).sharedSecret;
  // const encryptionKey = await importKey(sharedSecret, "secret");
  const getEncryptionKey = async (peerId) => {
    if (keys.current.has(peerId)) {
      return keys.current.get(peerId);
    }
    const friend = await db.friends.get(peerId);
    const secret = friend.sharedSecret;
    const key = await importKey(secret, "secret");
    keys.current.set(peerId, key);
    return key;
  };

  // USERS

  const getUser = async (userId) => {
    if (users[userId]) return users[userId];

    const userResult = await api.get(`/api/user?uid=${userId}`);

    if (userResult) {
      const { uid, displayName, email, photoURL } = userResult;

      return {
        uid,
        displayName,
        email,
        photoURL,
      };
    }

    return null;
  };

  const getUserByEmail = async (email) => {
    const user = Object.values(users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (user) return user;

    const userResult = await api.get(`/api/user?email=${email}`);

    if (userResult) return userResult;

    return null;
  };

  // FRIENDSHIP

  const removeFriend = (uid) => {
    db.friends.delete(uid);
  };

  const isFriend = (userId) => friends.has(userId);

  const requestFriendship = async (email) => {
    const friend = await getUserByEmail(email);
    if (friend) {
      requestFriendshipTo(friend.uid, friend);
    } else {
      throw new Error("User not found");
    }
  };

  // CONVERSATIONS
  const getConversations = (peerId) => {
    return conversations.filter((message) => message.peerId === peerId);
  };

  const unreadCounts = useMemo(() => {
    return conversations.reduce((acc, curr) => {
      if (curr?.isRead === false) {
        acc[curr.peerId] = (acc[curr.peerId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [conversations]);

  const addConversation = async (message) => {
    console.log("addConversation", message);
    console.log("message.blob", message.blob);
    message.peerId =
      message.senderId === userId ? message.receiverId : message.senderId;
    message.peerName =
      message.senderId === userId
        ? users[message.receiverId]?.displayName
        : message.senderName;

    const encryptionKey = await getEncryptionKey(message.peerId);

    const downloadNeeded = message.url && !message.blob?.size;
    if (downloadNeeded) {
      return db.conversations.add(message).then((id) => {
        fetch(message.url)
          .then((response) => response.blob())
          .then(async (blob) => {
            if (message.isEncrypted)
              blob = await decryptFile(blob, encryptionKey);

            if (message.isCompressed) blob = await decompress(blob);

            const file = new File([blob], message.fileName, {
              type: message.fileType,
            });
            // todo: verify hash
            // const hash = hashKey(file);
            // if (hash !== message.hash) {
            //   throw new Error("Hash mismatch");
            // }
            message.blob = file;
            delete message.url;
            db.conversations.update(id, message);
          })
          .catch((error) => {
            console.error("Failed to fetch and update blob:", error);
            return db.conversations.add({ ...message, fetchFailed: true });
          });

        return id;
      });
    } else if (message.blob) {
      if (message.isEncrypted)
        message.blob = await decryptFile(message.blob, encryptionKey);

      if (message.isCompressed) message.blob = await decompress(message.blob);

      const file = new File([message.blob], message.fileName, {
        type: message.fileType,
      });
      message.blob = file;
    } else if (message.isEncrypted) {
      message.content = await decrypt(message.content, encryptionKey);
    }

    return db.conversations.add(message);
  };

  // Delete message
  const deleteConversation = useCallback(
    async (message) => {
      try {
        await db.conversations
          .where("[senderId+timestamp]")
          .equals([message.senderId, message.timestamp])
          .delete();
      } catch (error) {
        console.error("Failed to delete message", error);
      }
    },
    [db]
  );

  // Mark my messages as read
  const markConversationsAsRead = (peerId) => {
    // mark all converastions as read in IndexedDB
    db.conversations.where("peerId").equals(peerId).modify({ isRead: true });
  };

  // Marking isSeen as false is equivalent to marking as post
  const markConversationAsPost = (messageId) => {
    // Fixed version:
    try {
      return db.conversations.update(messageId, { isSeen: false });
    } catch (error) {
      console.error("Failed to mark message as post:", error);
    }
  };

  // AUTHENTICATION ////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        setUserId(user.uid);
        setDisplayName(user.displayName);
      } else {
        console.warn("No user in auth state change event");
        setUser(null);
      }
    });

    return () => {
      console.log("Cleaning up auth listener");
      unsubscribe();
      setUser(null);
    };
  }, []);

  // SIGNALS //////////////////////////////////////////////////////////////////////////////////

  // outbound signal queue
  const messageQueue = useRef([]);
  const isProcessingQueue = useRef(false);

  // Process queued messages
  const processMessageQueue = useCallback(async () => {
    if (isProcessingQueue.current || !messageService) return;

    isProcessingQueue.current = true;

    while (messageQueue.current.length > 0) {
      const message = messageQueue.current[0];
      try {
        console.log("  >", message.type, message);
        await messageService.postSignal(message);
        messageQueue.current.shift(); // Remove processed message
      } catch (error) {
        console.error("Failed to process message:", error);
        break; // Stop processing on error
      }
    }

    isProcessingQueue.current = false;
  }, [messageService]);

  // Queue message and attempt to process
  const queueMessage = useCallback(
    (message) => {
      messageQueue.current.push(message);
      processMessageQueue();
    },
    [processMessageQueue]
  );

  // inblound signal queue
  const [signals, setSignals] = useState([]);
  const addSignal = (signal) => {
    setSignals((prev) => [...prev, signal]);
  };

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing) return;
    if (!signals?.length) return;

    setIsProcessing(true);

    const signal = signals[0];
    console.log("<  ", signal.type, signal);

    handleSignal(signal);

    setSignals((prev) => prev.slice(1));

    setIsProcessing(false);
  }, [signals, isProcessing]);

  const [peerIsTyping, setPeerIsTyping] = useState({});

  const handleSignal = async (signal) => {
    const { senderId, type, offer, answer, candidate } = signal;

    try {
      switch (type) {
        case "typing":
          if (signal.isTyping !== peerIsTyping[senderId])
            setPeerIsTyping((prev) => ({
              ...prev,
              [senderId]: signal.isTyping,
            }));
          break;

        case "offer":
          await handleOffer(senderId, offer);
          break;

        case "answer":
          await handleAnswer(senderId, answer);
          break;

        case "ice-candidate":
          await handleIceCandidate(senderId, candidate);
          break;

        default:
          console.warn("Unknown signal type:", type);
      }
    } catch (error) {
      console.error("Signal handling error:", error);
    }
  };

  // PUSHER SETUP /////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!user) return;

    const params = {
      userId: user.uid,
      displayName: user.displayName,
      userEmail: user.email,
      userPhotoURL: user.photoURL,
    };

    const client = getPusherClient(params, user.accessToken);
    // setSocketId(client.connection.socket_id);

    if (client) {
      const channel = client.subscribe("presence-lobby");

      channel.bind("pusher:subscription_succeeded", (members) => {
        setUsers(members.members);
      });

      channel.bind("pusher:member_added", (member) => {
        setUsers((prev) => ({ ...prev, [member.id]: member.info }));
      });

      channel.bind("pusher:member_removed", (member) => {
        setUsers((prev) => {
          const updated = { ...prev };
          delete updated[member.id];
          return updated;
        });
      });

      channel.bind("message", (data) => {
        if (data.to) {
          if (data.to === userId) setChatMessages((prev) => [...prev, data]);
          return;
        }
        setChatMessages((prev) => [...prev, data]);
      });

      // My private channel
      const privateChannel = client.subscribe(`private-user-${userId}`);

      // Listen for private messages
      privateChannel.bind("message", (data) => {
        // if not in active chat
        if (!document.hasFocus() || !router.asPath.includes(data.senderId)) {
          data.isRead = false;
        }

        addConversation(data);
      });

      // Listen for signal events
      privateChannel.bind("signal", (data) => {
        addSignal(data);
      });

      // Listen for file chunks
      privateChannel.bind("file-chunk", (data) => {
        const { senderId, index, totalChunks, hash, chunk, ...rest } = data;

        const key = `${senderId}-${hash}`;
        const chunks =
          files.current.get(key) || new Array(totalChunks).fill(null);
        chunks[index] = chunk;
        files.current.set(key, chunks);

        if (chunks.every((chunk) => chunk !== null)) {
          combine(chunks)
            .then((blob) => {
              // Optionally, verify the hash here
              // if (!verifyHash(decompressed, hash)) throw new Error("Hash mismatch");

              const message = {
                senderId,
                blob,
                hash,
                totalChunks,
                receivedTime: Date.now(),
                ...rest,
              };

              addConversation(message);
              // chunks completed for file: delete key
              files.current.delete(key);
            })
            .catch((error) => {
              console.error("Error combining chunks:", error);
            });
        }
      });

      privateChannel.bind("request", (data) => {
        setRequests((prev) => [...prev, data]);

        // Auto-remove after 30 seconds
        setTimeout(() => {
          setRequests((prev) =>
            prev.filter((req) => req.timestamp !== data.timestamp)
          );
        }, 30000);
      });

      // Listen for accepted requests
      privateChannel.bind("accept", async (data) => {
        switch (data.type.toLowerCase()) {
          case "game":
            localStorage.setItem(`${data.gameId}:id`, 1);
            router.push(`/lobby/${data.gameId}`);
            break;
          case "friend":
            await handleAcceptedFriendship(data);
            router.push(`/peer/${data.senderId}`);
            break;
        }
      });

      return () => {
        channel.unbind_all();
        privateChannel.unbind_all();
        client.unsubscribe("presence-lobby");
        client.unsubscribe(`private-user-${userId}`);
        disconnectPusher();
      };
    }
  }, [user]);

  useEffect(() => {
    if (user && !messageService) {
      const metadata = {
        senderId: userId,
        senderName: displayName,
      };
      setMessageService(new MessageService(metadata));
    }
  }, [user, messageService]);

  return (
    <MessagingContext.Provider
      value={{
        user,
        userId,
        displayName,
        users,
        setUsers,
        friends,
        isFriend,
        removeFriend,
        requestFriendship,
        requestFriendshipTo,
        acceptFriendship,
        getEncryptionKey,
        chatMessages,
        setChatMessages,
        requests,
        setRequests,
        conversations,
        getConversations,
        unreadCounts,
        addConversation,
        deleteConversation,
        markConversationAsPost,
        markConversationsAsRead,
        messageService,
        signals,
        addSignal,
        setSignals,
        peerIsTyping,
        createOffer,
        sendMessage,
        sendFile,
      }}
    >
      <RequestNotifications />
      {children}
    </MessagingContext.Provider>
  );
};

export default function useMessagingContext() {
  return useContext(MessagingContext);
}
