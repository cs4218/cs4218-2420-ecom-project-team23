import "@testing-library/jest-dom/extend-expect";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Pagenotfound from "./Pagenotfound";

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="mock-layout" title={title}>
    {children}
  </div>
));

describe("Page Not Found Component", () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Pagenotfound />
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
    expect(testId).toHaveAttribute("title", "go back- page not found");
  });

  test("renders 404 and go back button", () => {
    renderComponent();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Oops ! Page Not Found")).toBeInTheDocument();
    expect(screen.getByText("Go Back")).toBeInTheDocument();
  });

  test("go back button navigates to home page", () => {
    renderComponent();

    const goBackLink = screen.getByRole("link", { name: /go back/i });

    expect(goBackLink).toHaveAttribute("href", "/");
  });
});
