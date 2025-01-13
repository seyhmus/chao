import { styles } from "./constants";

const Store = ({ forPlayer, stones }) => {
  const storeClasses = `${styles.store}  
    ${
      forPlayer === 0
        ? "rotate-180 text-amber-900 shadow-inner shadow-amber-900 bg-amber-300/20"
        : "text-red-900 shadow-inner shadow-red-900 bg-red-300/20"
    } 
    `;

  return (
    <div className={storeClasses}>
      <div className="grid grid-rows-9 grid-cols-4 gap-1">
        {Array.from({ length: stones }, (_, i) => (
          <span key={i}>•</span>
        ))}
      </div>
    </div>
  );
};

export default Store;
