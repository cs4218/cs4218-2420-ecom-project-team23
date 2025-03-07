import "@testing-library/jest-dom/extend-expect";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import About from "./About";

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="mock-layout" title={title}>
    {children}
  </div>
));

describe("About Component", () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders layout", () => {
    renderComponent();

    const testId = screen.getByTestId("mock-layout");
    expect(testId).toBeInTheDocument();
    expect(testId).toHaveAttribute("title", "About us - Ecommerce app");
  });

  test("renders text correctly", () => {
    renderComponent();

    expect(screen.getByText("Add text")).toBeInTheDocument();
  });

  test("renders image correctly", () => {
    renderComponent();

    const image = screen.getByAltText("contactus");
    expect(image).toHaveAttribute("src", "/images/about.jpeg");
  });
});
