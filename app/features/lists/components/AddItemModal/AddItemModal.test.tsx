import { fireEvent, render, screen } from "@testing-library/react";
import AddItemModal from "./AddItemModal";

jest.mock("../../actions", () => ({
  createItemAction: jest.fn(),
}));

describe("AddItemModal", () => {
  test("abre el modal al clickear el botón", () => {
    render(<AddItemModal parentOptions={[]} />);

    expect(screen.queryByText("Completá los datos para agregar un nuevo ítem a la lista.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Agregar ítem" }));
    expect(screen.getByText("Completá los datos para agregar un nuevo ítem a la lista.")).toBeInTheDocument();
  });

  test("renderiza los campos del formulario dentro del modal", () => {
    render(<AddItemModal parentOptions={[{ id: "root", label: "Root" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar ítem" }));

    expect(screen.getByLabelText("Título del ítem")).toBeInTheDocument();
    expect(screen.getByLabelText("Agregar como hijo de")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar" })).toBeInTheDocument();
  });
});
