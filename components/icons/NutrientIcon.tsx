import Image from "next/image";
import { cn } from "@/lib/utils";

export const NUTRIENT_ICON_SRC = {
  carbs: "/bread.png",
  protein: "/meat.png",
  fat: "/fat.png",
  fiber: "/fiber.png",
  calories: "/fire.png",
  meal: "/lunch.png",
} as const;

export type NutrientIconType = keyof typeof NUTRIENT_ICON_SRC;

interface NutrientIconProps {
  type: NutrientIconType;
  size?: number;
  className?: string;
}

export function NutrientIcon({ type, size = 28, className }: NutrientIconProps) {
  return (
    <Image
      src={NUTRIENT_ICON_SRC[type]}
      alt=""
      width={size}
      height={size}
      className={cn("object-contain", className)}
      aria-hidden
    />
  );
}
