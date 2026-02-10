import { cn } from "../utils";

describe("cn", () => {
  test("concatena clases condicionales", () => {
    const className = cn("a", false && "b", "c");
    expect(className).toBe("a c");
  });

  test("resuelve conflictos de Tailwind dejando la clase más reciente", () => {
    const className = cn("px-2 py-2", "px-4");
    expect(className).toBe("py-2 px-4");
  });
});
