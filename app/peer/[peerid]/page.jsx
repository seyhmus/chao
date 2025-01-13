"use client";

import InProgressDialog from "@/components/InProgress";
import MessageInput from "@/components/MessageInput";
import MessageItem from "@/components/MessageItem";
import useMessagingContext from "@/context/MessageContext";
import { Flex, ScrollArea, Text } from "@radix-ui/themes";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { encrypt, encryptFile } from "@/lib/crypto";
import { hashKey } from "@/lib/fileUtil";

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

  // file upload - encrypted
  // todo: add status
  // todo: multipart upload
  const handleSendEncryptedFile = async (event) => {
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
    };

    try {
      const messageId = await addConversation({ ...fileMetadata, blob: file });

      const encryptionKey = await getEncryptionKey(peerid);

      const encryptedBlob = await encryptFile(file, encryptionKey);
      const encryptedFile = new File([encryptedBlob], file.name, {
        type: encryptedBlob.type,
      });

      const uploadResponse = await messageService.postFileToR2(
        encryptedFile,
        true // compress
      );

      await messageService.postEvent({
        ...fileMetadata,
        ...uploadResponse,
        eventType: "message",
        method: "pusher",
        isEncrypted: true,
      });

      markMessageAsPost(messageId);
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
        handleSendFile={handleSendEncryptedFile}
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
