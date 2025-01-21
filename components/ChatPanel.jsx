"use client";

import { useEffect, useRef, useMemo } from "react";

import {
  Flex,
  IconButton,
  TextArea,
  Card,
  Box,
  ScrollArea,
  Text,
  Tooltip,
  Link,
} from "@radix-ui/themes";
import { ChatBubbleIcon, ImageIcon, Link1Icon } from "@radix-ui/react-icons";

import ImageLightBox from "@/components/ImageLightBox";

import { cn } from "@/lib/utils";
import DebugCard from "./DebugCard.jsx";
import useMessagingContext from "@/context/MessageContext.js";

const ChatPanel = ({
  processMessage,
  processImage,
  sendFriendRequest,
  sendGameRequest,
}) => {
  const { userId, users, chatMessages, setChatMessages, isFriend } =
    useMessagingContext();

  const addPreview = (previewId, previewUrl) => {
    setChatMessages((prev) => [
      ...prev,
      {
        previewId,
        previewUrl,
        senderId: userId,
        style: "animate-pulse",
      },
    ]);
  };

  const clearPreview = (previewId, previewUrl) => {
    setChatMessages((prev) =>
      prev.filter((msg) => msg.previewId !== previewId)
    );
    URL.revokeObjectURL(previewUrl);
  };

  const groupedMessages = useMemo(() => {
    return chatMessages.reduce((acc, data) => {
      if (acc.length > 0 && acc[acc.length - 1].senderId === data.senderId) {
        acc[acc.length - 1].messages.push(data);
      } else {
        acc.push({ senderId: data.senderId, messages: [data] });
      }
      return acc;
    }, []);
  }, [chatMessages]);

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <Flex direction="column" className="h-full fixed inset-0 pt-16">
      {/* Messages */}
      <ScrollArea
        type="hover"
        scrollbars="vertical"
        className="flex-1 px-4 py-2 h-full"
      >
        {groupedMessages.map((group, index) => (
          <Card
            key={index}
            variant={group.senderId === userId ? "surface" : "classic"}
            className={cn(
              "message-card",
              group.senderId === userId ? "ml-auto" : "",
              "w-fit max-w-[65%] mb-2 p-2"
            )}
          >
            <Text size={"1"} weight={"bold"} color="amber">
              {group.senderId !== userId && group.messages[0]?.senderName}
            </Text>
            {group.messages.map((msg, msgIndex) => (
              <Box key={msgIndex} className="mt-1">
                {msg.message ? (
                  <>
                    <pre
                      className={cn(
                        msg.style,
                        "whitespace-pre-wrap break-words font-sans"
                      )}
                    >
                      {msg.message}
                    </pre>
                    {msg.link && (
                      <Link size="1" color="amber" href={msg.link}>
                        <Flex gap={"1"}>
                          <Link1Icon /> Follow {msg.senderName}
                        </Flex>
                      </Link>
                    )}
                  </>
                ) : (
                  <ImageLightBox
                    className={cn(msg.style, "rounded-md overflow-hidden")}
                    src={msg.url || msg.previewUrl}
                    alt="sent image"
                  />
                )}
              </Box>
            ))}
            <Flex
              className="message-row"
              direction="row"
              gap="2"
              justify={"between"}
              align="center"
            >
              <Text size="1">
                {new Date(group.messages[0]?.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Flex gap="1">
                {group.senderId !== userId &&
                  !isFriend(group.senderId) &&
                  sendFriendRequest && (
                    <Tooltip content="Send Friend Request">
                      <IconButton
                        onClick={() =>
                          sendFriendRequest(group.messages[0]?.senderId)
                        }
                      >
                        <ChatBubbleIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                {group.senderId !== userId && sendGameRequest && (
                  <Tooltip content="Send a game request">
                    <IconButton
                      onClick={() =>
                        sendGameRequest(group.messages[0]?.senderId)
                      }
                    >
                      🎮
                    </IconButton>
                  </Tooltip>
                )}
              </Flex>
            </Flex>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <DebugCard content={{ users, groupedMessages }} />

      {/* Message input */}
      <Box
        className="flex-shrink-0 sticky bottom-0 left-0 right-0"
        style={{ boxShadow: "var(--elevate)" }}
      >
        <Flex gap="2" align="center" p="4" className="pb-safe">
          <input
            className="hidden"
            id="fileInput"
            type="file"
            onChange={(e) =>
              processImage(e.target.files[0], addPreview, clearPreview)
            }
            accept="image/*"
          />
          <label
            htmlFor="fileInput"
            className="inline-flex items-center justify-center cursor-pointer"
          >
            <ImageIcon width={32} height={32} />
          </label>

          <TextArea
            variant="surface"
            className="flex-grow min-h-[40px] max-h-[120px] resize-none"
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.altKey &&
                !e.shiftKey &&
                !e.metaKey &&
                !e.ctrlKey &&
                e.target.value.trim()
              ) {
                e.preventDefault();
                processMessage(e.target.value.trim());
                e.target.value = "";
                e.target.rows = 1;
              }
            }}
            onChange={(e) => {
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + "px";
            }}
            // onPaste={(e) => {
            //   const text = e.clipboardData.getData("text");
            //   const lines = text.split("\n").length;
            //   e.target.rows = lines;
            // }}
          />
        </Flex>
      </Box>
    </Flex>
  );
};

export default ChatPanel;
