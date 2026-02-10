import { fireEvent, render, screen } from "@testing-library/react";
import ParentSelector from "./ParentSelector";

describe("ParentSelector", () => {
  test("mapea label seleccionado al id en el hidden input", () => {
    render(
      <ParentSelector
        options={[
          { id: "root", label: "Root" },
          { id: "child", label: "Root / Child" },
        ]}
        name="parentId"
        label="Padre"
        placeholder="Buscar..."
      />
    );

    const input = screen.getByLabelText("Padre");
    fireEvent.change(input, { target: { value: "Root / Child" } });

    const hidden = document.querySelector('input[name="parentId"][type="hidden"]') as HTMLInputElement;
    expect(hidden.value).toBe("child");
  });

  test("limpia selección cuando el texto no coincide con una opción", () => {
    render(
      <ParentSelector
        options={[{ id: "root", label: "Root" }]}
        name="parentId"
        label="Padre"
      />
    );

    const input = screen.getByLabelText("Padre");
    fireEvent.change(input, { target: { value: "No existe" } });

    const hidden = document.querySelector('input[name="parentId"][type="hidden"]') as HTMLInputElement;
    expect(hidden.value).toBe("");
  });

  test("renderiza helpText cuando se provee", () => {
    render(
      <ParentSelector
        options={[]}
        name="parentId"
        label="Padre"
        helpText="Elegí un nodo opcional."
      />
    );

    expect(screen.getByText("Elegí un nodo opcional.")).toBeInTheDocument();
  });
});
