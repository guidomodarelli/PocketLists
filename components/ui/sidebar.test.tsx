import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { SidebarProvider, useSidebar } from "./sidebar"

type SidebarStateHarnessProps = {
  defaultOpen?: boolean
}

function SidebarStateHarness({ defaultOpen = true }: SidebarStateHarnessProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SidebarStateProbe />
    </SidebarProvider>
  )
}

function SidebarStateProbe() {
  const { open, state, toggleSidebar } = useSidebar()

  return (
    <div>
      <p data-testid="sidebar-state">{state}</p>
      <p data-testid="sidebar-open">{String(open)}</p>
      <button type="button" onClick={toggleSidebar}>
        toggle-sidebar
      </button>
    </div>
  )
}

function setDesktopEnvironment() {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1280,
  })

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => {
      return {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as unknown as MediaQueryList
    }),
  })
}

describe("SidebarProvider localStorage persistence", () => {
  beforeEach(() => {
    setDesktopEnvironment()
    window.localStorage.clear()
  })

  test("renders collapsed immediately when localStorage says closed", () => {
    window.localStorage.setItem("sidebar_state", "false")

    render(<SidebarStateHarness defaultOpen={true} />)

    expect(screen.getByTestId("sidebar-state")).toHaveTextContent("collapsed")
    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("false")
  })

  test("updates localStorage when user toggles sidebar state", () => {
    render(<SidebarStateHarness defaultOpen={true} />)

    const toggleButton = screen.getByRole("button", { name: "toggle-sidebar" })

    fireEvent.click(toggleButton)
    expect(window.localStorage.getItem("sidebar_state")).toBe("false")

    fireEvent.click(toggleButton)
    expect(window.localStorage.getItem("sidebar_state")).toBe("true")
  })

  test("falls back to defaultOpen when stored value is missing or invalid", async () => {
    render(<SidebarStateHarness defaultOpen={false} />)

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-state")).toHaveTextContent("collapsed")
      expect(screen.getByTestId("sidebar-open")).toHaveTextContent("false")
    })

    window.localStorage.setItem("sidebar_state", "invalid")
    render(<SidebarStateHarness defaultOpen={true} />)

    await waitFor(() => {
      const stateValues = screen.getAllByTestId("sidebar-state")
      const openValues = screen.getAllByTestId("sidebar-open")

      expect(stateValues.at(-1)).toHaveTextContent("expanded")
      expect(openValues.at(-1)).toHaveTextContent("true")
    })
  })
})
