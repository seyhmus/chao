import PitRow from "./PitRow";
import Store from "./Store";
import { styles } from "./constants";

const MultiPlayerGame = ({
  id,
  gameState,
  handlePitClick,
  opponentLeft = false,
}) => {
  return (
    <div className={styles.board}>
      {opponentLeft && (
        <div className="absolute z-20 inset-0 text-center content-center text-2xl font-mono font-bold bg-red-500/40 p-2 rounded-3xl">
          Waiting for opponent to reconnect...
        </div>
      )}

      {/* Stores and pits grids */}
      <div className={`${styles.grid} ${id === 1 && "rotate-180"}`}>
        <Store forPlayer={1} stones={gameState.stores[1]} />

        <PitRow
          forPlayer={1}
          gameState={gameState}
          onPitClick={handlePitClick}
        />

        <Store forPlayer={0} stones={gameState.stores[0]} />
        <PitRow
          forPlayer={0}
          gameState={gameState}
          onPitClick={handlePitClick}
        />
      </div>
      {/* Player 1's message */}
      <div className={styles.message}>
        {gameState.message ||
          (gameState.winner && gameState.winner === id + 1 && `You won!`) ||
          (gameState.winner && gameState.winner !== id + 1 && `You lost!`) ||
          (gameState.currentPlayer === id ? `Your turn` : `Opponent's turn`)}
      </div>
    </div>
  );
};

export default MultiPlayerGame;
