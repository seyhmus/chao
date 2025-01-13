import { PITS_PER_PLAYER, styles } from "./constants";

const PitRow = ({ forPlayer, gameState, onPitClick }) => {
  const startIndex = forPlayer === 0 ? 0 : PITS_PER_PLAYER;
  const endIndex = forPlayer === 0 ? PITS_PER_PLAYER : PITS_PER_PLAYER * 2;

  return (
    <div className={`${styles.pitRow} ${forPlayer === 1 && "rotate-180"}`}>
      {gameState.pits.slice(startIndex, endIndex).map((stones, index) => (
        <button
          key={startIndex + index}
          onClick={() => onPitClick(startIndex + index)}
          disabled={
            gameState.winner ||
            gameState.currentPlayer !== forPlayer ||
            stones === 0
          }
          className={`${styles.pit} 
            ${
              forPlayer === 1
                ? "rotate-180 text-red-900 shadow-inner shadow-red-900 bg-red-200/20"
                : "text-amber-900 shadow-inner shadow-amber-900 bg-amber-300/20"
            }
            ${
              gameState.currentPlayer === forPlayer &&
              stones > 0 &&
              "opacity-100 hover:opacity-75"
            }`}
        >
          <div className="my-4 grid grid-rows-6 grid-cols-4 gap-1">
            {Array.from({ length: stones }, (_, i) => (
              <span key={i}>•</span>
            ))}
            <span className="invisible" key="inv">
              •
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default PitRow;
