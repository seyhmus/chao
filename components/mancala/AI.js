import { PITS_PER_PLAYER } from "./constants";
import { makeMove } from "./MakeMove";

// AI evaluation function to score a game state
const evaluatePosition = (pits, stores, player) => {
  const opponent = 1 - player;
  const playerPits =
    player === 0 ? pits.slice(0, PITS_PER_PLAYER) : pits.slice(PITS_PER_PLAYER);
  const opponentPits =
    player === 0 ? pits.slice(PITS_PER_PLAYER) : pits.slice(0, PITS_PER_PLAYER);

  return (
    // Weight the stones in store more heavily
    stores[player] * 2 -
    stores[opponent] * 2 +
    // Consider stones in play
    playerPits.reduce((sum, stones) => sum + stones, 0) -
    opponentPits.reduce((sum, stones) => sum + stones, 0) +
    // Bonus for having more moves available
    playerPits.filter((stones) => stones > 0).length -
    opponentPits.filter((stones) => stones > 0).length
  );
};

// Find the best move for the AI
export const findBestMove = (gameState, depth = 5) => {
  const player = gameState.currentPlayer;
  const startIndex = player === 0 ? 0 : PITS_PER_PLAYER;
  const endIndex = startIndex + PITS_PER_PLAYER;
  let bestScore = -Infinity;
  let bestMove = -1;

  // Minimax function with alpha-beta pruning
  const minimax = (pits, stores, depth, player, alpha, beta, isMaximizing) => {
    if (depth === 0) {
      return evaluatePosition(pits, stores, gameState.currentPlayer);
    }

    const start = player === 0 ? 0 : PITS_PER_PLAYER;
    const end = start + PITS_PER_PLAYER;
    let value = isMaximizing ? -Infinity : Infinity;

    for (let i = start; i < end; i++) {
      if (pits[i] === 0) continue;

      const result = makeMove(
        { pits: pits, stores: stores, currentPlayer: player },
        i
      );

      if (result.endedInStore) {
        const nextValue = minimax(
          result.pits,
          result.stores,
          depth - 1,
          player,
          alpha,
          beta,
          isMaximizing
        );
        value = isMaximizing
          ? Math.max(value, nextValue)
          : Math.min(value, nextValue);
      } else {
        const nextValue = minimax(
          result.pits,
          result.stores,
          depth - 1,
          1 - player,
          alpha,
          beta,
          !isMaximizing
        );
        value = isMaximizing
          ? Math.max(value, nextValue)
          : Math.min(value, nextValue);
      }

      if (isMaximizing) {
        alpha = Math.max(alpha, value);
      } else {
        beta = Math.min(beta, value);
      }

      if (beta <= alpha) break;
    }

    return value;
  };

  // Try each possible move
  for (let i = startIndex; i < endIndex; i++) {
    if (gameState.pits[i] === 0) continue;

    const result = makeMove(gameState, i);
    const score = minimax(
      result.pits,
      result.stores,
      depth - 1,
      result.endedInStore ? player : 1 - player,
      -Infinity,
      Infinity,
      result.endedInStore
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }

  return bestMove;
};
