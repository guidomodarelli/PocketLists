import NextLink from "next/link";
import type { ComponentProps } from "react";

type LinkProps = ComponentProps<typeof NextLink>;

export default function Link({ scroll = false, ...props }: LinkProps) {
  return <NextLink {...props} scroll={scroll} />;
}
