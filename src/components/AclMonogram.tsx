interface AclMonogramProps {
  size?: number;
  /** When true, renders for dark/navy backgrounds (light glyphs). */
  onInk?: boolean;
  /** Show the ascending gold arc. */
  arc?: boolean;
  className?: string;
}

/**
 * ACL brand monogram: "A" and "L" interlocked in front, a gold "C" behind,
 * set in Libre Caslon Display, with an optional ascending gold arc.
 */
export const AclMonogram = ({
  size = 48,
  onInk = false,
  arc = true,
  className,
}: AclMonogramProps) => {
  const front = onInk ? "hsl(var(--paper))" : "hsl(var(--ink))";
  const gold = "hsl(var(--gold))";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 230 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="ACL"
    >
      {/* Gold C behind */}
      <text
        x="118"
        y="168"
        textAnchor="middle"
        fontFamily="'Libre Caslon Display', Georgia, serif"
        fontSize="190"
        fill={gold}
        opacity={0.85}
      >
        C
      </text>

      {/* A + L interlocked in front */}
      <text
        x="86"
        y="160"
        textAnchor="middle"
        fontFamily="'Libre Caslon Display', Georgia, serif"
        fontSize="150"
        fill={front}
      >
        A
      </text>
      <text
        x="150"
        y="160"
        textAnchor="middle"
        fontFamily="'Libre Caslon Display', Georgia, serif"
        fontSize="150"
        fill={front}
      >
        L
      </text>

      {/* Ascending gold arc out of the top-right corner */}
      {arc && (
        <>
          <path
            d="M -6 214 C 70 206, 150 150, 244 -8"
            stroke={gold}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="244" cy="-8" r="4" fill={gold} />
        </>
      )}
    </svg>
  );
};

export default AclMonogram;
