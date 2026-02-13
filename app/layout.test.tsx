import type { ReactElement } from "react";
import RootLayout, { metadata } from "./layout";

jest.mock("next/font/google", () => ({
  Outfit: () => ({ variable: "--font-outfit" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

describe("RootLayout", () => {
  test("expone metadata esperada", () => {
    expect(metadata.title).toBe("PocketLists");
    expect(metadata.description).toBe("Listas jerárquicas con completado inteligente");
  });

  test("renderiza html/body con fuentes y children", () => {
    const element = RootLayout({
      children: <div>Contenido</div>,
    }) as ReactElement<{
      lang: string;
      className?: string;
      children: ReactElement<{ className: string; children: React.ReactNode }>;
    }>;

    expect(element.type).toBe("html");
    expect(element.props.lang).toBe("es");
    expect(element.props.className).toContain("dark");

    const bodyElement = element.props.children;
    expect(bodyElement.type).toBe("body");
    expect(bodyElement.props.className).toContain("--font-outfit");
    expect(bodyElement.props.className).toContain("--font-geist-mono");

    const bodyChildren = Array.isArray(bodyElement.props.children)
      ? bodyElement.props.children
      : [bodyElement.props.children];

    expect(bodyChildren).toHaveLength(2);
    expect((bodyChildren[1] as ReactElement).props.children).toBe("Contenido");
  });
});
