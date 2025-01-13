export const INITIAL_STONES = 4;
export const PITS_PER_PLAYER = 6;

export const newGameState = {
  pits: Array(PITS_PER_PLAYER * 2).fill(INITIAL_STONES),
  stores: [0, 0],
  currentPlayer: 0,
  winner: null,
  message: "",
  isAIEnabled: false,
};

export const styles = {
  board:
    "board flex flex-col items-center gap-2 sm:gap-3 md:gap-4 lg:gap-8 p-2 sm:p-3 md:p-4 lg:p-8 rounded-3xl shadow-inner shadow-red-500 backdrop-grayscale",
  grid: "relative grid grid-cols-8 gap-4 w-full",
  store:
    "row-span-2 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold rounded-full backdrop-blur-sm backdrop-hue-rotate-15",
  pitRow: "col-span-6 grid grid-cols-6 gap-2 sm:gap-3 md:gap-4",
  pit: "w-full p-2 flex items-center justify-center rotate-180 text-2xl sm:text-3xl md:text-4xl font-bold rounded-full backdrop-blur-sm backdrop-hue-rotate-25",
  message:
    "text-md md:text-2xl font-bold text-center p-1 md:p-2 rounded-xl w-full max-w-md text-amber-900 shadow-inner shadow-amber-900 bg-amber-300/20 backdrop-blur-sm backdrop-hue-rotate-25",
  button:
    "p-2 shadow-inner shadow-amber-900 bg-amber-300/20 backdrop-blur-sm backdrop-hue-rotate-25 rounded-lg transition-all duration-300 hover:bg-amber-400/30 hover:shadow-amber-800 active:transform active:scale-95",
};
