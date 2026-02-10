import NextLink from "next/link";
import type { ComponentProps } from "react";
import { joinClasses } from "@/app/lib/joinClasses";
import styles from "./Link.module.scss";

type LinkProps = ComponentProps<typeof NextLink>;

export default function Link({ scroll = false, className, ...props }: LinkProps) {
  return <NextLink {...props} scroll={scroll} className={joinClasses(styles.link, className)} />;
}
