import "@testing-library/jest-dom/extend-expect";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Dashboard from "./Dashboard";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="user-menu">Dashboard</div>
));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

describe("Dashboard Test Cases", () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>
    );
  };

  const mockUser = {
    name: "John Doe",
    email: "john_doe@gmail.com",
    address: "123 Main St",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders Layout component", () => {
    renderComponent();

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  test("renders UserMenu component", () => {
    renderComponent();

    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });

  test("displays user information when auth is populated", () => {
    useAuth.mockReturnValue([{ user: mockUser }]);
    renderComponent();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john_doe@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
  });

  test("displays user information when auth is not populated", () => {
    useAuth.mockReturnValue([{ user: null }]);
    renderComponent();

    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("john_doe@gmail.com")).not.toBeInTheDocument();
    expect(screen.queryByText("123 Main St")).not.toBeInTheDocument();
  });
});
