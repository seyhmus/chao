import React from "react";
import { Bot, Users } from "lucide-react";

const AIToggle = ({ isEnabled, onToggle }) => {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg shadow-inner shadow-amber-900 bg-amber-300/20 backdrop-blur-sm backdrop-hue-rotate-25">
      <Users
        className={`w-5 h-5 ${
          isEnabled ? "text-amber-900/40" : "text-amber-900"
        }`}
      />
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={onToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-amber-200/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-amber-900 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-900/20" />
      </label>
      <Bot
        className={`w-5 h-5 ${
          isEnabled ? "text-amber-900" : "text-amber-900/40"
        }`}
      />
    </div>
  );
};

export default AIToggle;
