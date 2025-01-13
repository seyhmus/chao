"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Button,
  Box,
  DropdownMenu,
  Avatar,
  Flex,
  Heading,
  Link,
  IconButton,
} from "@radix-ui/themes";
import { ChevronLeftIcon, EnterIcon, ExitIcon } from "@radix-ui/react-icons";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import useMessagingContext from "@/context/MessageContext";

const NavBar = () => {
  const pathname = usePathname();
  const isActive = (path) => pathname === path;

  const router = useRouter();

  const { user, users } = useMessagingContext();

  let peerId = null;
  let title = null;
  let photoURL = null;

  if (pathname.startsWith("/peer/")) {
    peerId = pathname.split("/peer/")[1];
    title = users[peerId]?.displayName;
    photoURL = users[peerId]?.photoURL;
  } else if (pathname.startsWith("/lobby")) {
    title = "Lobby";
  }

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-10">
      <Flex
        align="center"
        gap="2"
        p="2"
        style={{ boxShadow: "var(--elevate)" }}
      >
        {isActive("/") ? (
          <Link href="/">
            <span style={{ fontFamily: "Inspiration", fontSize: "2rem" }}>
              Chao
            </span>
          </Link>
        ) : (
          <IconButton
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              if (window.history.length > 2) router.back();
              else router.push("/");
            }}
            className="inline-flex items-center justify-center"
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
        {photoURL && <Avatar src={photoURL} alt={title} />}
        {title && <Heading>{title}</Heading>}
        <Box flexGrow={"1"} />
        {user ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Avatar
                src={user.photoURL}
                fallback={user.displayName[0]}
              ></Avatar>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item color="crimson" onClick={signOut}>
                <ExitIcon /> Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        ) : (
          <Button onClick={signIn}>
            <EnterIcon /> Sign in
          </Button>
        )}
      </Flex>
    </nav>
  );
};

export default NavBar;
