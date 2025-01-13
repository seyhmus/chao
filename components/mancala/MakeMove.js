import { PITS_PER_PLAYER } from "./constants";

export function makeMove(gameState, pitIndex) {
  // Get stones from selected pit
  const newPits = [...gameState.pits];
  const newStores = [...gameState.stores];
  let stones = newPits[pitIndex];

  // Distribute stones
  let currentIndex = pitIndex;
  newPits[currentIndex] = 0;

  let singleStone = stones === 1;

  let endedInStore = false;

  while (stones > 0) {
    if (!singleStone) {
      newPits[currentIndex]++;
      stones--;
    } else {
      singleStone = false;
    }

    currentIndex++;

    endedInStore = false;
    if (
      currentIndex === PITS_PER_PLAYER &&
      gameState.currentPlayer === 0 &&
      stones > 0
    ) {
      newStores[0]++;
      stones--;
      endedInStore = true;
    }
    if (
      currentIndex === 2 * PITS_PER_PLAYER &&
      gameState.currentPlayer === 1 &&
      stones > 0
    ) {
      newStores[1]++;
      stones--;
      endedInStore = true;
    }

    currentIndex %= 2 * PITS_PER_PLAYER;
  }

  if (!endedInStore) {
    const lastIndex =
      currentIndex === 0 ? 2 * PITS_PER_PLAYER - 1 : currentIndex - 1;
    const oppositeIndex = 2 * PITS_PER_PLAYER - (lastIndex + 1);

    // Check for capture
    if (newPits[lastIndex] === 1 && newPits[oppositeIndex] > 0) {
      if (gameState.currentPlayer === 0 && lastIndex < PITS_PER_PLAYER) {
        newStores[0] += newPits[oppositeIndex] + 1;
        newPits[lastIndex] = 0;
        newPits[oppositeIndex] = 0;
      } else if (
        gameState.currentPlayer === 1 &&
        lastIndex >= PITS_PER_PLAYER
      ) {
        newStores[1] += newPits[oppositeIndex] + 1;
        newPits[lastIndex] = 0;
        newPits[oppositeIndex] = 0;
      }
    }
  }

  // Check if game is over
  const player1PitsEmpty = newPits
    .slice(0, PITS_PER_PLAYER)
    .every((stones) => stones === 0);
  const player2PitsEmpty = newPits
    .slice(PITS_PER_PLAYER)
    .every((stones) => stones === 0);

  if (player1PitsEmpty || player2PitsEmpty) {
    // Collect remaining stones
    let remainingStones = 0;
    newPits.forEach((stones, index) => {
      if (stones > 0) {
        remainingStones += stones;
        newPits[index] = 0;
      }
    });

    if (player1PitsEmpty) {
      newStores[1] += remainingStones;
    } else {
      newStores[0] += remainingStones;
    }

    // Determine winner
    const newWinner =
      newStores[0] > newStores[1]
        ? 1
        : newStores[1] > newStores[0]
        ? 2
        : gameState.currentPlayer + 1; // Current player wins ties

    return {
      ...gameState,
      pits: newPits,
      stores: newStores,
      winner: newWinner,
    };
  }

  return {
    ...gameState,
    pits: newPits,
    stores: newStores,
    currentPlayer: endedInStore
      ? gameState.currentPlayer
      : (gameState.currentPlayer + 1) % 2,
  };
}
