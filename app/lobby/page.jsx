"use client";

import ChatPanel from "@/components/ChatPanel";

import InProgressDialog from "@/components/InProgress";
import useMessagingContext from "@/context/MessageContext";

export default function Lobby() {
  const { userId, displayName, messageService, requestFriendshipTo } =
    useMessagingContext();

  const processMessage = (data) => {
    const message = {
      senderId: userId,
      senderName: displayName,
      method: "pusher",
      eventType: "message",
      timestamp: Date.now(),
      message: data,
    };
    messageService.postEvent(message);
  };

  const processImage = (file, addPreview, clearPreview) => {
    messageService.postImage(
      file,
      addPreview,
      clearPreview,
      userId,
      displayName
    );
  };

  if (!userId || !messageService)
    return <InProgressDialog notification="Initializing..." />;

  return (
    <ChatPanel
      userId={userId}
      processMessage={processMessage}
      processImage={processImage}
      sendFriendRequest={requestFriendshipTo}
      sendGameRequest={messageService.postGameRequest}
    />
  );
}
