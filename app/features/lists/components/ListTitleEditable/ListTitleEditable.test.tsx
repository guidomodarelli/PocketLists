import { fireEvent, render, screen } from "@testing-library/react";
import ListTitleEditable from "./ListTitleEditable";

describe("ListTitleEditable", () => {
  test("expone clase fluida para ocupar el ancho disponible del header", () => {
    render(<ListTitleEditable listId="list-1" title="Lista original" />);

    expect(screen.getByRole("heading", { name: "Lista original" })).toHaveClass(
      "list-title-editable--fluid"
    );
  });

  test("muestra placeholder cuando el nombre está vacío y permite editarlo", () => {
    render(<ListTitleEditable listId="list-1" title="" />);

    const trigger = screen.getByRole("button", { name: "(Sin nombre)" });
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);
    const input = screen.getByLabelText("Editar nombre de lista");
    expect(input).toHaveValue("");
  });

  test("al clickear el título entra en modo edición con el valor actual", () => {
    render(<ListTitleEditable listId="list-1" title="Lista original" />);

    fireEvent.click(screen.getByRole("button", { name: "Lista original" }));

    const input = screen.getByLabelText("Editar nombre de lista");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Lista original");
  });

  test("guarda cambios al perder foco cuando el título cambió", () => {
    const onEditTitle = jest.fn();

    render(<ListTitleEditable listId="list-1" title="Lista original" onEditTitle={onEditTitle} />);
    fireEvent.click(screen.getByRole("button", { name: "Lista original" }));

    const input = screen.getByLabelText("Editar nombre de lista");
    fireEvent.change(input, { target: { value: "Lista nueva" } });
    fireEvent.blur(input);

    expect(onEditTitle).toHaveBeenCalledTimes(1);
    expect(onEditTitle).toHaveBeenCalledWith("list-1", "Lista nueva");
  });

  test("permite guardar nombre vacío al perder foco", () => {
    const onEditTitle = jest.fn();

    render(<ListTitleEditable listId="list-1" title="Lista original" onEditTitle={onEditTitle} />);
    fireEvent.click(screen.getByRole("button", { name: "Lista original" }));

    const input = screen.getByLabelText("Editar nombre de lista");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(onEditTitle).toHaveBeenCalledTimes(1);
    expect(onEditTitle).toHaveBeenCalledWith("list-1", "");
  });

  test("cancela cambios con Esc y no dispara guardado", () => {
    const onEditTitle = jest.fn();

    render(<ListTitleEditable listId="list-1" title="Lista original" onEditTitle={onEditTitle} />);
    fireEvent.click(screen.getByRole("button", { name: "Lista original" }));

    const input = screen.getByLabelText("Editar nombre de lista");
    fireEvent.change(input, { target: { value: "Temporal" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByLabelText("Editar nombre de lista")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lista original" })).toBeInTheDocument();
    expect(onEditTitle).not.toHaveBeenCalled();
  });
});
