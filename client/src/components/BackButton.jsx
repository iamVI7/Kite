export default function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0 group"
    >
      <span
        className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0
          border border-[#d1d5db]
          shadow-[0_1px_3px_rgba(0,0,0,0.08)]
          group-hover:border-[#9ca3af] group-hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)]
          transition-all duration-150"
      >
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
          <path
            d="M11 14L6 9l5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="text-[14px] font-medium text-neutral-900 tracking-tight">
        {label}
      </span>
    </button>
  );
}