import { FileIcon } from "@radix-ui/react-icons";
import { Flex, Tooltip, IconButton, TextArea } from "@radix-ui/themes";

const MessageInput = ({
  handleSendFile,
  handleSendMessage,
  handleGameRequest,
  peerId,
  setIsTyping,
  isTyping,
}) => {
  return (
    <Flex gap="1" p="1" style={{ boxShadow: "var(--elevate)" }}>
      <Flex direction="column" align="center" justify="center" gap="1">
        {/* Send file button */}
        <input
          className="hidden"
          id="fileInput"
          type="file"
          onChange={handleSendFile}
        />
        <Tooltip content="Send a file">
          <IconButton>
            <label htmlFor="fileInput">
              <FileIcon />
            </label>
          </IconButton>
        </Tooltip>

        {/* Send game request button */}
        {handleGameRequest && (
          <Tooltip content="Send a game request">
            <IconButton onClick={() => handleGameRequest(peerId)}>
              🎮
            </IconButton>
          </Tooltip>
        )}
      </Flex>

      <TextArea
        variant="surface"
        placeholder="Type a message... (Press Enter to send)"
        className="flex-grow transition-all duration-100 ease-in-out"
        onKeyDown={(e) => {
          // check if local description of peer connection is set
          if (
            e.key === "Enter" &&
            !e.altKey &&
            !e.shiftKey &&
            !e.ctrlKey &&
            e.target.value.trim()
          ) {
            handleSendMessage(e);
          }
        }}
        onChange={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
          if (e.target.value.trim().length > 0) {
            if (!isTyping) setIsTyping(true);
          } else {
            if (isTyping) setIsTyping(false);
          }
        }}
        // onPaste={(e) => {
        //   const text = e.clipboardData.getData("text");
        //   const lines = text.split("\n").length;
        //   e.target.rows = lines;
        // }}
      />
    </Flex>
  );
};

export default MessageInput;
