import type { ReactElement } from "react";
import RootLayout, { metadata } from "./layout";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
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
    }) as ReactElement<{ lang: string; children: ReactElement<{ className: string; children: ReactElement }> }>;

    expect(element.type).toBe("html");
    expect(element.props.lang).toBe("es");

    const bodyElement = element.props.children;
    expect(bodyElement.type).toBe("body");
    expect(bodyElement.props.className).toContain("--font-geist-sans");
    expect(bodyElement.props.className).toContain("--font-geist-mono");
    expect(bodyElement.props.children.props.children).toBe("Contenido");
  });
});
