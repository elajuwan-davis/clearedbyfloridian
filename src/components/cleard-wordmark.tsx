/** Cleard wordmark (vector). `tone` picks the letter color; the A stays brand blue. */
export function ClearedWordmark({
  className,
  tone = "#FAF3E6",
  title = "Cleard",
}: {
  className?: string;
  tone?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 2200 480"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fontFamily="Fraunces, Iowan Old Style, Georgia, serif"
        fontSize="390"
        fontWeight="700"
        letterSpacing="24"
        transform="translate(-145, -170)"
      >
        <text x="145" y="610" fill={tone}>
          CLE
        </text>
        {/* custom A: outer chevron with the counter knocked out */}
        <path
          fillRule="evenodd"
          fill="#2B70E0"
          d="M1075 610 L1210 270 L1345 610 L1265 610 L1210 470 L1155 610 Z M1168 505 L1252 505 L1210 395 Z"
        />
        <text x="1355" y="610" fill={tone}>
          RD
        </text>
      </g>
    </svg>
  );
}

export default ClearedWordmark;
