import "@testing-library/jest-dom/extend-expect";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "./Layout";

jest.mock("react-hot-toast");

jest.mock("./Header", () => () => <div data-testid="header">Header</div>);

jest.mock("./Footer", () => () => <div data-testid="footer">Footer</div>);

jest.mock("react-helmet", () => ({
  Helmet: ({ children }) => <div data-testid="helmet-mock">{children}</div>,
}));

jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster-mock">Toaster</div>,
}));

describe("Layout Component", () => {
  const mockCustomProps = {
    title: "Custom title",
    description: "Custom description",
    keywords: "Custom keywords",
    author: "Custom author",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should render Layout component with default props", () => {
    render(
      <MemoryRouter>
        <Layout>This is Content</Layout>
      </MemoryRouter>
    );

    expect(screen.getByTestId("helmet-mock")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("toaster-mock")).toBeInTheDocument();
    expect(screen.getByText("This is Content")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  test("should render Layout component with custom props", () => {
    render(
      <MemoryRouter>
        <Layout {...mockCustomProps}>This is Custom Content</Layout>
      </MemoryRouter>
    );

    expect(screen.getByTestId("helmet-mock")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("toaster-mock")).toBeInTheDocument();
    expect(screen.getByText("This is Custom Content")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  test("should render Helmet properties", () => {
    render(
      <MemoryRouter>
        <Layout {...mockCustomProps}>This is Custom Content</Layout>
      </MemoryRouter>
    );

    expect(document.querySelector('meta[name="description"]').content).toBe(
      mockCustomProps.description
    );
    expect(document.querySelector('meta[name="keywords"]').content).toBe(
      mockCustomProps.keywords
    );
    expect(document.querySelector('meta[name="author"]').content).toBe(
      mockCustomProps.author
    );
    expect(document.title).toBe(mockCustomProps.title);
  });
});
