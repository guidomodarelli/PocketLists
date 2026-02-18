import { render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";

describe("Dialog", () => {
  test("renders a close button with larger click target", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Titulo</DialogTitle>
          <DialogDescription>Descripcion</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toHaveClass("h-9");
    expect(closeButton).toHaveClass("w-9");
    expect(closeButton).toHaveClass("p-2");
    expect(closeButton).toHaveClass("cursor-pointer");
  });
});
