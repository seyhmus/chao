"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { newGameState } from "@/components/mancala/constants";
import { makeMove } from "@/components/mancala/MakeMove";
import MultiPlayerGame from "@/components/mancala/MultiPlayerGame";

import { getPusherClient } from "@/lib/pusher";
import useMessagingContext from "@/context/MessageContext";

const Game = () => {
  const { gameid } = useParams();

  const { user, messageService } = useMessagingContext();

  const [gameState, setGameState] = useState(newGameState);
  const [id, setId] = useState();
  const [opponentLeft, setOpponentLeft] = useState(false);

  const handlePitClick = async (pitIndex) => {
    if (gameState.currentPlayer !== id) return;
    const newState = makeMove(gameState, pitIndex);
    if (!newState) return; // if move is invalid
    setGameState(newState);

    messageService.postGameMove(gameid, newState);
  };

  useEffect(() => {
    // Restore game state from localStorage on mount
    if (gameid) {
      const savedState = localStorage.getItem(gameid);
      if (savedState) {
        try {
          setGameState(JSON.parse(savedState));
        } catch (err) {
          console.error("Failed to restore game state", err);
        }
      }

      setId(() => parseInt(localStorage.getItem(`${gameid}:id`)));
    }
  }, [gameid]);

  // Save game state to localStorage when it changes
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(gameid, JSON.stringify(gameState));
    }
  }, [gameid, gameState]);

  useEffect(() => {
    if (!user) return;

    const params = {
      userId: user.uid,
      displayName: user.displayName,
      userEmail: user.email,
      userPhotoURL: user.photoURL,
    };

    const pusherClient = getPusherClient(params, user.accessToken);
    const channel = pusherClient.subscribe(`presence-game-${gameid}`);

    channel.bind("pusher:subscription_succeeded", (members) => {
      console.log("Members:", members);
    });

    channel.bind("pusher:member_added", (member) => {
      console.log(member);
      setOpponentLeft(false); //todo: check for edge cases
    });

    channel.bind("pusher:member_removed", (member) => {
      console.log(member);
      setOpponentLeft(true); //todo: check for edge cases
    });

    // Handle game moves
    channel.bind("game-move", (data) => {
      setGameState(data.gameState);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`presence-game-${gameid}`);
    };
  }, [user, gameid]);

  return (
    <MultiPlayerGame
      id={id}
      gameState={gameState}
      handlePitClick={handlePitClick}
      opponentLeft={opponentLeft}
    />
  );
};

export default Game;
