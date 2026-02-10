import { fireEvent, render, screen } from "@testing-library/react";
import AddItemModal from "./AddItemModal";

describe("AddItemModal", () => {
  test("dispara evento global para abrir borrador raíz inline", () => {
    const eventSpy = jest.spyOn(window, "dispatchEvent");

    render(<AddItemModal />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar ítem" }));

    expect(eventSpy).toHaveBeenCalledTimes(1);
    const event = eventSpy.mock.calls[0]?.[0];
    expect(event?.type).toBe("lists:add-root-draft");

    eventSpy.mockRestore();
  });
});
