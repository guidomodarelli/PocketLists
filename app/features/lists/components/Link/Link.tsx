import NextLink from "next/link";
import type { ComponentProps } from "react";
import styles from "./Link.module.scss";

type LinkProps = ComponentProps<typeof NextLink>;

function unirClases(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function Link({ scroll = false, className, ...props }: LinkProps) {
  return <NextLink {...props} scroll={scroll} className={unirClases(styles.link, className)} />;
}
