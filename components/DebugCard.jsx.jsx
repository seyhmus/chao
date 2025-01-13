import { Code, IconButton, Tabs, Box, Popover } from "@radix-ui/themes";

import { CodeIcon } from "lucide-react";

const DebugCard = ({ content }) => {
  const tabs = Object.keys(content);

  if (process.env.NEXT_PUBLIC_ENV === "prod") return <></>;

  return (
    <Box className="fixed right-5 z-20">
      <Popover.Root>
        <Popover.Trigger>
          <IconButton variant="soft">
            <CodeIcon />
          </IconButton>
        </Popover.Trigger>
        <Popover.Content>
          <Tabs.Root defaultValue={tabs[0]} style={{ height: "50vh" }}>
            <Tabs.List>
              {tabs.map((key) => (
                <Tabs.Trigger key={key} value={key}>
                  {key}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {tabs.map((key) => (
              <Tabs.Content key={key} value={key}>
                <Code>
                  <pre>{JSON.stringify(content[key], null, 2)}</pre>
                </Code>
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </Popover.Content>
      </Popover.Root>
    </Box>
  );
};

export default DebugCard;
