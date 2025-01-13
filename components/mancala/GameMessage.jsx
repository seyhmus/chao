import { styles } from "./constants";

const GameMessage = ({ forPlayer, gameState }) => {
  const isRotated = forPlayer === 1;

  const { message, winner, currentPlayer } = gameState;

  return (
    <div
      className={`${styles.message} ${isRotated ? "rotate-180" : ""} 
        ${
          currentPlayer === (isRotated ? 0 : 1) &&
          winner === null &&
          "text-amber-900/20"
        }`}
    >
      {message ||
        (winner === (isRotated ? 2 : 1) && `You win!`) ||
        (winner === (isRotated ? 1 : 2) && `You lose!`) ||
        (currentPlayer === (isRotated ? 1 : 0)
          ? `Your turn`
          : `Opponent's turn`)}
    </div>
  );
};

export default GameMessage;
