import NextLink from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import styles from "./Link.module.scss";

type LinkProps = ComponentProps<typeof NextLink>;

export default function Link({ scroll = false, className, ...props }: LinkProps) {
  return <NextLink {...props} scroll={scroll} className={cn(styles.link, className)} />;
}
