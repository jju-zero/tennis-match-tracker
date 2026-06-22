interface RacketIconProps {
  className?: string;
  size?: number;
}

export function RacketIcon({ className = "", size = 24 }: RacketIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Racket head - filled circle */}
      <circle cx="12" cy="8" r="6.5" fill="currentColor" opacity="0.9" />

      {/* String grid pattern - darker lines */}
      <g stroke="#0f1726" strokeWidth="1.2">
        <line x1="9.5" y1="4.5" x2="9.5" y2="11.5" />
        <line x1="12" y1="4" x2="12" y2="12" />
        <line x1="14.5" y1="4.5" x2="14.5" y2="11.5" />

        <line x1="9" y1="5.5" x2="15" y2="5.5" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="9" y1="10.5" x2="15" y2="10.5" />
      </g>

      {/* Handle - filled */}
      <rect
        x="11"
        y="14"
        width="2"
        height="7.5"
        fill="currentColor"
        rx="1"
      />
      <rect
        x="10.5"
        y="21"
        width="3"
        height="1"
        fill="currentColor"
        rx="0.5"
      />
    </svg>
  );
}
