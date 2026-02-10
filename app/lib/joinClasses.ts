import type { ClassValue } from "clsx";
import { cn } from "@/lib/utils";

export function joinClasses(...classNames: ClassValue[]) {
  return cn(...classNames);
}
