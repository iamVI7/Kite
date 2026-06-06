import { useRef } from "react";
import { motion } from "framer-motion";

export default function DropZone({ disabled, isDragging, onInputChange }) {
  const inputRef = useRef();

  return (
    <motion.div
      animate={{ scale: isDragging ? 1.012 : 1 }}
      transition={{ duration: 0.15 }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3
        min-h-[148px] rounded-3xl border-2 transition-all duration-200 select-none
        ${isDragging
          ? "border-violet-400 bg-violet-50 cursor-copy"
          : disabled
          ? "border-dashed border-ink-100 bg-ink-50 cursor-not-allowed opacity-50"
          : "border-dashed border-ink-200 bg-white hover:border-violet-300 hover:bg-violet-50/40 cursor-pointer"
        }`}
    >
      <input ref={inputRef} type="file" multiple className="hidden"
        onChange={onInputChange} disabled={disabled} />

      {/* Icon */}
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all
        ${isDragging
          ? "bg-violet-100 scale-110"
          : disabled
          ? "bg-ink-100"
          : "bg-ink-50 border border-ink-100"
        }`}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 12V3M6 6l3-3 3 3"
            stroke={isDragging ? "#7c6ff5" : disabled ? "#c8c8d0" : "#86869a"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.5 13v.75A1.75 1.75 0 004.25 15.5h9.5A1.75 1.75 0 0015.5 13.75V13"
            stroke={isDragging ? "#7c6ff5" : disabled ? "#c8c8d0" : "#86869a"}
            strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>

      {/* Label */}
      <div className="text-center px-4">
        <p className={`text-sm font-medium leading-snug
          ${isDragging ? "text-violet-600" : disabled ? "text-ink-300" : "text-ink-500"}`}>
          {isDragging
            ? "Release to send"
            : disabled
            ? "Waiting for connection"
            : "Drop files here"}
        </p>
        {!disabled && !isDragging && (
          <p className="text-xs text-ink-400 mt-1">
            or{" "}
            <span className="text-violet-500 font-medium">click to browse</span>
            {" "}· any format, any size
          </p>
        )}
      </div>
    </motion.div>
  );
}