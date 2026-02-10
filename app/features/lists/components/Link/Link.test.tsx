import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import Link from "./Link";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    scroll,
    className,
    children,
  }: {
    href: string;
    scroll?: boolean;
    className?: string;
    children: ReactNode;
  }) => (
    <a href={href} data-scroll={String(scroll)} className={className}>
      {children}
    </a>
  ),
}));

describe("Link", () => {
  test("usa scroll=false por defecto", () => {
    render(<Link href="/destino">Ir</Link>);
    const anchor = screen.getByRole("link", { name: "Ir" });
    expect(anchor).toHaveAttribute("data-scroll", "false");
  });

  test("mergea clases custom con la clase base", () => {
    render(
      <Link href="/destino" className="custom">
        Ir
      </Link>
    );
    const anchor = screen.getByRole("link", { name: "Ir" });
    expect(anchor.className).toContain("custom");
  });
});
