type Theme = "dark" | "light";
type Size = "sm" | "md" | "lg";

interface LogoProps {
  theme?: Theme;
  size?: Size;
}

const iconSizes: Record<Size, number> = {
  sm: 24,
  md: 32,
  lg: 44,
};

const textSizes: Record<Size, number> = {
  sm: 16,
  md: 20,
  lg: 28,
};

const palette = {
  dark: { blue: "#4A9EFF", text: "#FFFFFF", gold: "#F5C842" },
  light: { blue: "#1A6FCC", text: "#0B1120", gold: "#E8A820" },
};

export default function Logo({ theme = "dark", size = "md" }: LogoProps) {
  const iconSize = iconSizes[size];
  const textSize = textSizes[size];
  const aiSize = Math.round(textSize * 0.65);
  const colors = palette[theme];

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width={iconSize}
        height={iconSize}
        aria-hidden="true"
      >
        <rect x="8" y="11" width="4" height="17" rx="1" fill={colors.blue} opacity="0.5" />
        <rect x="14" y="8" width="5" height="20" rx="1" fill={colors.blue} opacity="0.75" />
        <rect x="21" y="11" width="4" height="17" rx="1" fill={colors.blue} opacity="0.5" />
        <rect x="13" y="6" width="7" height="22" rx="2" fill={colors.blue} />
        <circle cx="16" cy="4" r="2.5" fill={colors.gold} />
      </svg>

      <div style={{ display: "inline-flex", alignItems: "baseline" }}>
        <span style={{ fontSize: textSize, fontWeight: 700, color: colors.text, letterSpacing: "-0.01em" }}>
          Prop
        </span>
        <span style={{ fontSize: textSize, fontWeight: 700, color: colors.blue, letterSpacing: "-0.01em" }}>
          Mate
        </span>
        <span style={{ fontSize: aiSize, fontWeight: 700, color: colors.gold, marginLeft: 3, letterSpacing: "0.02em" }}>
          AI
        </span>
      </div>
    </div>
  );
}
