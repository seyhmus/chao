import { Dialog, Spinner, Flex } from "@radix-ui/themes";

const InProgressDialog = ({ notification }) => {
  return (
    <Dialog.Root open={true}>
      <Dialog.Content>
        <Dialog.Title>{notification || "Loading"}</Dialog.Title>
        <Dialog.Description>Please wait...</Dialog.Description>
        <Flex justify="center" align="center">
          <Spinner />
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default InProgressDialog;
