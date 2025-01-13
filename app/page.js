"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  TextField,
  Box,
  Flex,
  Text,
  Avatar,
  Badge,
  ScrollArea,
  SegmentedControl,
  Dialog,
  Button,
} from "@radix-ui/themes";
import useMessagingContext from "@/context/MessageContext";
import {
  CrossCircledIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";

const MainPage = () => {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const {
    user,
    users,
    friends,
    removeFriend,
    requestFriendship,
    unreadCounts,
  } = useMessagingContext();

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      try {
        await requestFriendship(e.target.value.trim());
        setConfirmation("Friend request sent");
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleFriendClick = (peerId) => {
    router.push(`/peer/${peerId}`);
  };

  const handleRemoveFriend = async (e, peerId) => {
    e.stopPropagation();
    try {
      await removeFriend(peerId);
    } catch (error) {
      setError(error.message);
    }
  };
  const handleDialogClose = (open) => {
    if (!open) {
      setConfirmation(null);
      setError(null);
    }
  };

  if (!user) return <></>;

  return (
    <Container p="2">
      <TextField.Root
        placeholder="Search friends…"
        onChange={(e) => setSearchTerm(e.target.value)}
      >
        <TextField.Slot value={searchTerm}>
          <MagnifyingGlassIcon height="16" width="16" />
        </TextField.Slot>
      </TextField.Root>
      <SegmentedControl.Root defaultValue="all" radius="full" my="2">
        <SegmentedControl.Item value="all">Friends</SegmentedControl.Item>
        {/* <SegmentedControl.Item value="unread">Unread</SegmentedControl.Item> */}
        <SegmentedControl.Item
          value="lobby"
          onClick={() => router.push("/lobby")}
        >
          Lobby
        </SegmentedControl.Item>
        {/* <SegmentedControl.Item>
          <Dialog.Root>
            <Dialog.Trigger>
              <Flex justify="center" align="center" gap="1">
                <PlusCircledIcon /> Group
              </Flex>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Title>Group Chat</Dialog.Title>
              <Dialog.Description>Create a new group chat</Dialog.Description>
              <TextField.Root placeholder="Group name" my="2"></TextField.Root>
              <Dialog.Close>
                <CrossCircledIcon className="absolute top-4 right-4 cursor-pointer" />
              </Dialog.Close>
              <Flex justify={"end"} gap={"2"}>
                <Dialog.Close>
                  <Button>Cancel</Button>
                </Dialog.Close>
                <Dialog.Close>
                  <Button>Save</Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </SegmentedControl.Item> */}
        <SegmentedControl.Item>
          <Dialog.Root onOpenChange={handleDialogClose}>
            <Dialog.Trigger>
              <Flex justify="center" align="center" gap="1">
                <PlusIcon /> Friend
              </Flex>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Title>Add Friend</Dialog.Title>
              <Dialog.Description>Enter their email address</Dialog.Description>

              <TextField.Root
                placeholder="friend@gmail.com... (Press Enter to send)"
                my="2"
                onChange={() => setError(null)}
                onKeyDown={handleKeyDown}
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon height="16" width="16" />
                </TextField.Slot>
              </TextField.Root>
              {error && <Text color="red">{error}</Text>}
              {confirmation && (
                <Flex justify={"between"} align={"center"}>
                  <Text color="green">{confirmation}</Text>
                  <Dialog.Close>
                    <Button>Close</Button>
                  </Dialog.Close>
                </Flex>
              )}
              <Dialog.Close>
                <CrossCircledIcon className="absolute top-4 right-4 cursor-pointer" />
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Root>
        </SegmentedControl.Item>
      </SegmentedControl.Root>

      <ScrollArea
        type="hover"
        scrollbars="vertical"
        className="h-[calc(100vh-var(--header))]"
      >
        {[...friends.values()]
          .filter((friend) =>
            friend.displayName.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((friend) => (
            <Box
              key={friend.userId}
              onClick={() => handleFriendClick(friend.userId)}
              className="user-box"
            >
              <Flex
                align="center"
                gap="3"
                p="4"
                style={{
                  borderBottom: "1px solid var(--gray-5)",
                  cursor: "pointer",
                }}
              >
                <Avatar
                  src={friend.photoURL || users[friend.userId]?.photoURL}
                  size="3"
                  fallback={friend.displayName.charAt(0).toUpperCase()}
                  radius="full"
                  className="select-none"
                />

                <Text size="3" weight="medium" className="select-none">
                  {friend.displayName}
                </Text>
                <Button
                  variant="ghost"
                  color="red"
                  onClick={(e) => handleRemoveFriend(e, friend.userId)}
                  className="user-trash"
                >
                  <TrashIcon />
                </Button>

                <Box flexGrow="1" />

                {unreadCounts[friend.userId] > 0 && (
                  <Badge
                    size="1"
                    variant="soft"
                    color="amber"
                    className="select-none"
                  >
                    {unreadCounts[friend.userId]} unread
                  </Badge>
                )}

                {users[friend.userId] && (
                  <Badge
                    size="1"
                    variant="soft"
                    color="green"
                    className="select-none"
                  >
                    online
                  </Badge>
                )}
              </Flex>
            </Box>
          ))}
      </ScrollArea>
    </Container>
  );
};

export default MainPage;
