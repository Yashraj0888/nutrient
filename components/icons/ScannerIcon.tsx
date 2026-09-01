import { cn } from "@/lib/utils";

interface ScannerIconProps {
  size?: number;
  className?: string;
  /** Icon fill — defaults to dark green for use on lime buttons */
  color?: "dark" | "lime" | "white";
}

const COLORS = {
  dark: "#1a2e05",
  lime: "#b8e62e",
  white: "#ffffff",
} as const;

export function ScannerIcon({ size = 26, className, color = "dark" }: ScannerIconProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: COLORS[color],
        WebkitMaskImage: "url(/scanner.png)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: "url(/scanner.png)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}
