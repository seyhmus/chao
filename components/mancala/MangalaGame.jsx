"use client";

import { useState, useEffect, useCallback } from "react";
import { makeMove } from "./MakeMove";
import { findBestMove } from "./AI";
import AIToggle from "./AIToggle";
import GameMessage from "./GameMessage";
import Store from "./Store";
import PitRow from "./PitRow";
import { RotateCcwSquare } from "lucide-react";
import { newGameState, styles } from "./constants";

export default function MangalaGame() {
  const [gameState, setGameState] = useState(newGameState);
  const [isLoading, setIsLoading] = useState(false);

  // Move AI logic to useCallback
  const handleAIMove = useCallback(() => {
    if (
      gameState.isAIEnabled &&
      gameState.currentPlayer === 1 &&
      gameState.winner === null
    ) {
      setIsLoading(true);
      // Simulate AI thinking time
      setTimeout(() => {
        const aiMove = findBestMove(gameState);
        console.log("AI move:", aiMove);
        if (aiMove !== -1) {
          handlePitClick(aiMove);
        }
        setIsLoading(false);
      }, 500);
    }
  }, [gameState]);

  useEffect(() => {
    handleAIMove();
  }, [handleAIMove]);

  const handlePitClick = useCallback(
    (pitIndex) => {
      if (isLoading) return; // Prevent moves while AI is thinking
      const newState = makeMove(gameState, pitIndex);
      if (!newState) return; // Invalid move
      setGameState(newState);
    },
    [gameState, isLoading]
  );

  const handleReset = useCallback(() => {
    setGameState(newGameState);
  }, []);

  const toggleAI = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isAIEnabled: !prev.isAIEnabled,
    }));
  }, []);

  return (
    <div className={styles.board}>
      {!gameState.isAIEnabled && (
        <GameMessage forPlayer={1} gameState={gameState} />
      )}

      {/* Stores and pits grids */}
      <div className={styles.grid}>
        {isLoading && (
          <div className="absolute -inset-2 bg-amber-950/20 rounded-3xl text-3xl font-bold flex items-center justify-center">
            <div className="bg-amber-500 text-white rounded-lg border-amber-950 p-2">
              AI is thinking...
            </div>
          </div>
        )}

        <Store forPlayer={1} stones={gameState.stores[1]} />
        <PitRow
          forPlayer={1}
          gameState={gameState}
          onPitClick={handlePitClick}
          disabled={isLoading || gameState.currentPlayer !== 1}
        />

        <Store forPlayer={0} stones={gameState.stores[0]} />
        <PitRow
          forPlayer={0}
          gameState={gameState}
          onPitClick={handlePitClick}
          disabled={isLoading || gameState.currentPlayer !== 0}
        />
      </div>

      {/* Player 1's message */}
      <GameMessage forPlayer={0} gameState={gameState} />

      {/* Bottom Controls */}
      <div className="flex w-full gap-3 border-t-2 text-amber-900 text-lg font-bold border-amber-900 pt-5">
        <AIToggle isEnabled={gameState.isAIEnabled} onToggle={toggleAI} />
        <div className="flex-grow"></div>
        <button onClick={handleReset} className={styles.button}>
          <RotateCcwSquare />
        </button>
      </div>
    </div>
  );
}
