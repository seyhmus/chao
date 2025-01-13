import { useState, useEffect } from "react";
import { Flex, IconButton, Popover, ScrollArea, Table } from "@radix-ui/themes";
import { ResetIcon, TableIcon } from "@radix-ui/react-icons";

const Conversations = ({ db }) => {
  const [storedMessages, setStoredMessages] = useState([]);

  // Function to fetch conversations and update state
  const fetchConversations = async () => {
    try {
      const conversations = await getAllConversations();
      setStoredMessages(conversations); // Update state with fetched conversations
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // Function to get all conversations from the database
  const getAllConversations = () => {
    return db.conversations.toArray();
  };

  // Use useEffect to fetch data when the component mounts
  useEffect(() => {
    fetchConversations();
  }, []); // Empty dependency array ensures this runs only once

  return (
    <>
      <ScrollArea style={{ height: "50vh" }}>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Sender</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Timestamp</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Content</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Details</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {storedMessages &&
              storedMessages.map((message, index) => (
                <Table.Row key={index}>
                  <Table.Cell>{message.senderName}</Table.Cell>
                  <Table.Cell>
                    {new Date(message.timestamp).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell>{message.content}</Table.Cell>
                  <Table.Cell>
                    <Popover.Root>
                      <Popover.Trigger>
                        <IconButton style={{ cursor: "pointer" }}>
                          <TableIcon />
                        </IconButton>
                      </Popover.Trigger>
                      <Popover.Content>
                        <pre>{JSON.stringify(message, null, 2)}</pre>
                      </Popover.Content>
                    </Popover.Root>
                  </Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
        </Table.Root>
        <Flex justify="between" mt={"3"}>
          {storedMessages.length} conversations
          <IconButton
            style={{ cursor: "pointer" }}
            onClick={fetchConversations}
          >
            <ResetIcon />
          </IconButton>
        </Flex>
      </ScrollArea>
    </>
  );
};

export default Conversations;
