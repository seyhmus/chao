"use client";

import InProgressDialog from "@/components/InProgress";
import MessageInput from "@/components/MessageInput";
import MessageItem from "@/components/MessageItem";
import useMessagingContext from "@/context/MessageContext";
import { Flex, ScrollArea, Text } from "@radix-ui/themes";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { encrypt } from "@/lib/crypto";

const PrivateChat = () => {
  const { peerid } = useParams();
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const {
    userId,
    displayName,
    users,
    getEncryptionKey,
    getConversations,
    addConversation,
    deleteConversation,
    markMessagesAsRead,
    markMessageAsPost,
    messageService,
    peerIsTyping,
  } = useMessagingContext();

  useEffect(() => {
    if (!peerid || !messageService) return;
    markMessagesAsRead(peerid); // mark messages as read on page load
  }, [peerid, messageService]);

  const send = async (data) => {
    let response;
    if (data.isSignal) response = await messageService.postSignal(data);
    else response = await messageService.postEvent(data);

    return { ...data, ...response };
  };

  useEffect(() => {
    if (!userId) return;

    send({
      receiverId: peerid,
      type: "typing",
      isTyping,
      isSignal: true,
    });
  }, [isTyping]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const plainMessage = event.target.value.trim();
    if (!plainMessage) return;

    // const sharedSecret = friends.get(peerid).sharedSecret;
    // console.log("shared secret used for encryption", sharedSecret);
    // const encryptionKey = await importKey(sharedSecret, "secret");
    const encryptionKey = await getEncryptionKey(peerid);

    const content = await encrypt(plainMessage, encryptionKey);

    const message = await send({
      senderId: userId,
      senderName: displayName,
      receiverId: peerid,
      content,
      isEncrypted: true,
      eventType: "message",
      timestamp: Date.now(),
    });

    addConversation({ ...message, isSeen: false });
    event.target.value = "";
    setIsTyping(false);
  };

  const handleSendFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileMetadata = {
      senderId: userId,
      senderName: displayName,
      receiverId: peerid,
      timestamp: Date.now(),
      fileName: file.name,
      fileType: file.type,
    };

    try {
      const messageId = await addConversation({ ...fileMetadata, blob: file });

      const uploadResponse = await messageService.postFileToR2(file);
      await messageService.postEvent({
        ...uploadResponse,
        ...fileMetadata,
        eventType: "message",
        method: "pusher",
      });

      markMessageAsPost(messageId);
    } catch (error) {
      deleteConversation(fileMetadata);
      console.error(error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [getConversations(peerid).length]);

  if (!messageService) return <InProgressDialog notification="Loading..." />;

  return (
    <Flex direction="column" className="h-full fixed inset-0 pt-16">
      <ScrollArea
        ref={scrollRef}
        type="hover"
        scrollbars="vertical"
        className="flex-1 px-4 py-2"
      >
        <Flex direction="column" gap="2" p="2" pb="6">
          {getConversations(peerid).map((msg, index) => (
            <MessageItem
              key={index}
              message={msg}
              userId={userId}
              handleDeleteMessage={deleteConversation}
            />
          ))}
          {peerIsTyping[peerid] && (
            <Text size="1" style={{ opacity: 0.7, fontStyle: "italic" }}>
              {users[peerid]?.displayName || "User"} is typing...
            </Text>
          )}
        </Flex>
      </ScrollArea>

      <MessageInput
        handleSendFile={handleSendFile}
        handleSendMessage={handleSendMessage}
        handleGameRequest={messageService.postGameRequest}
        peerId={peerid}
        setIsTyping={setIsTyping}
        isTyping={isTyping}
      />
    </Flex>
  );
};

export default PrivateChat;
