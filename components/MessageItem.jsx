import { Card, Flex, Text, Popover, Link } from "@radix-ui/themes";
import { CodeIcon, TrashIcon } from "@radix-ui/react-icons";
import BlobView from "./BlobView";

const MessageItem = ({ message, userId, handleDeleteMessage }) => {
  return (
    <Flex justify={message.senderId === userId ? "end" : "start"}>
      <Card
        className="message-card"
        style={{
          backgroundColor: message.senderId === userId && "var(--blue-6)",
        }}
      >
        <MessageContent message={message} />
        <MessageFooter
          message={message}
          handleDeleteMessage={handleDeleteMessage}
        />
      </Card>
    </Flex>
  );
};

const MessageContent = ({ message }) => {
  if (message.content) {
    return <pre style={message.style}>{message.content}</pre>;
  }
  if (message.blob) {
    return (
      <BlobView
        blob={message.blob}
        fileName={message.fileName}
        fileType={message.fileType}
        className={message.style}
      />
    );
  }
  return <pre style={message.style}>{message}</pre>;
};

const MessageFooter = ({ message, handleDeleteMessage }) => {
  return (
    <Flex
      className="message-row"
      direction="row"
      gap="2"
      align="center"
      justify={"between"}
    >
      <Flex gap="2" align="center">
        <Text size="1">{new Date(message.timestamp).toLocaleTimeString()}</Text>
        <Text size="1">
          {"isSeen" in message ? (message.isSeen ? "✓✓" : "✓") : ""}
        </Text>
      </Flex>
      <Popover.Root>
        <Popover.Trigger>
          <Link href="#">
            <CodeIcon />
          </Link>
        </Popover.Trigger>
        <Popover.Content>
          <pre>{JSON.stringify(message, null, 2)}</pre>
        </Popover.Content>
      </Popover.Root>
      <Link href="#" onClick={() => handleDeleteMessage(message)}>
        <TrashIcon />
      </Link>
    </Flex>
  );
};

export default MessageItem;
