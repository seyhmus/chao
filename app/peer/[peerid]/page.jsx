"use client";

import InProgressDialog from "@/components/InProgress";
import MessageInput from "@/components/MessageInput";
import MessageItem from "@/components/MessageItem";
import useMessagingContext from "@/context/MessageContext";
import { encrypt, encryptFile } from "@/lib/crypto";
import { arrayBufferToBase64, compress, hashKey } from "@/lib/fileUtil";
import { compressImage } from "@/lib/imageUtil";
import { Flex, ScrollArea, Text } from "@radix-ui/themes";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
    markConversationsAsRead,
    markConversationAsPost,
    messageService,
    peerIsTyping,
    createOffer,
    sendMessage, // implemented in useWebRTC
  } = useMessagingContext();

  useEffect(() => {
    if (!peerid || !messageService) return;
    markConversationsAsRead(peerid); // mark messages as read on page load
    createOffer(peerid); // initiate peer connection offer
  }, [peerid, messageService]);

  const send = async (data) => {
    let response;
    try {
      sendMessage(peerid, data);
      console.log("sending", peerid, data);
    } catch (error) {
      console.info("Fallback to pusher for sending mesasge", error);
      if (data.isSignal) response = await messageService.postSignal(data);
      else response = await messageService.postEvent(data);
    }
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

  // first compress, then encrypt file
  // todo: add status
  // todo: multipart upload
  const handleSendFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const hash = await hashKey(file);

    const fileMetadata = {
      senderId: userId,
      senderName: displayName,
      receiverId: peerid,
      timestamp: Date.now(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hash,
      blob: file,
    };

    console.log("fileMetadata", fileMetadata);
    const messageId = await addConversation(fileMetadata);
    console.log("conversation is added with messageId", messageId);

    try {
      // compress first. if image, then use ImageUtil.compress to compress the image itself
      // otherwise, compress the file using gzip
      console.log("compressing file", file);
      if (file.type.startsWith("image/")) {
        fileMetadata.blob = await compressImage(file);
      } else {
        fileMetadata.blob = await compress(file);
        fileMetadata.isCompressed = true;
      }

      // encrypt next
      console.log("encrypting file", fileMetadata.blob);
      const encryptionKey = await getEncryptionKey(peerid);
      const encrypted = await encryptFile(fileMetadata.blob, encryptionKey); // array buffer
      fileMetadata.isEncrypted = true;
      delete fileMetadata.blob; // remove blob from the message

      // try sending using webrtc first
      try {
        const CHUNK_SIZE = 1024 * 64;
        // const totalChunks = Math.ceil(base64String.length / CHUNK_SIZE);
        const totalChunks = Math.ceil(encrypted.byteLength / CHUNK_SIZE);

        for (let index = 0; index < totalChunks; index++) {
          const start = index * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, encrypted.byteLength);
          const bchunk = encrypted.slice(start, end);
          const chunk = arrayBufferToBase64(bchunk);

          await sendMessage(peerid, {
            ...fileMetadata,
            totalChunks,
            chunk,
            index,
          });
        }
      } catch (error) {
        // fallback to R2/Pusher
        console.log("fallback to R2/Pusher", error);
        fileMetadata.blob = new Blob([encrypted], {
          type: "application/octet-stream",
          name: file.name,
        });
        const uploadResponse = await messageService.uploadFile(
          fileMetadata.blob
        );

        if (!uploadResponse.url) throw new Error("Error uploading file");

        await messageService.postEvent({
          ...fileMetadata,
          ...uploadResponse,
          eventType: "message",
          method: "pusher",
        });

        console.log("file uploaded", fileMetadata, uploadResponse);
      }

      markConversationAsPost(messageId); // upload message with response?
    } catch (error) {
      deleteConversation(fileMetadata);
      console.error("Failed to upload encrypted file:", error);
      throw error;
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
