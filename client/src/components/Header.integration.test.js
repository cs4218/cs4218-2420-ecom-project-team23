import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import Header from "./Header";
import axios from "axios";
import useCategory from "../hooks/useCategory";

jest.mock("axios");

jest.mock("../context/auth", () => ({
  ...jest.requireActual("../context/auth"),
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

const TestPathname = () => {
  const location = useLocation();
  return <div data-testid="url-pathname">{location.pathname}</div>;
};

describe("Header Integration Test", () => {
  const mockUser = {
    name: "John Doe",
    role: 0,
    token: "user-token",
  };

  const mockAdmin = {
    name: "Admin John",
    role: 1,
    token: "admin-token",
  };

  const mockCategories = [
    { name: "name1", slug: "slug1" },
    { name: "name2", slug: "slug2" },
    { name: "name3", slug: "slug3" },
    { name: "name4", slug: "slug4" },
  ];

  const renderComponent = () => {
    return render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter>
              <Header />
              <TestPathname />
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("clicking links navigates to the correct pages", () => {
    renderComponent();

    fireEvent.click(screen.getByRole("link", { name: /🛒 Virtual Vault/i }));
    expect(screen.getByTestId("url-pathname")).toHaveTextContent("/");

    fireEvent.click(screen.getByRole("link", { name: /home/i }));
    expect(screen.getByTestId("url-pathname")).toHaveTextContent("/");

    fireEvent.click(screen.getByRole("link", { name: /^categories$/i }));
    expect(screen.getByTestId("url-pathname")).toHaveTextContent("/categories");

    fireEvent.click(
      screen.getByRole("link", {
        name: /^all categories$/i,
      })
    );
    expect(screen.getByTestId("url-pathname")).toHaveTextContent("/categories");

    fireEvent.click(screen.getByRole("link", { name: /register/i }));
    expect(screen.getByTestId("url-pathname")).toHaveTextContent("/register");

    fireEvent.click(screen.getByRole("link", { name: /login/i }));
    expect(screen.getByTestId("url-pathname")).toHaveTextContent("/login");

    fireEvent.click(screen.getByRole("link", { name: /cart/i }));
    expect(screen.getByTestId("url-pathname")).toHaveTextContent("/cart");
  });

  test("should handle logout correctly", () => {
    useAuth.mockReturnValue([{ user: mockUser }, jest.fn()]);
    renderComponent();

    fireEvent.click(screen.getByRole("link", { name: /logout/i }));

    expect(screen.getByTestId("url-pathname")).toHaveTextContent("/login");
  });

  test("individual categories should navigate correctly", () => {
    useCategory.mockReturnValue(mockCategories);

    renderComponent();

    fireEvent.click(screen.getByRole("link", { name: "name1" }));
    expect(screen.getByTestId("url-pathname")).toHaveTextContent(
      "/category/slug1"
    );
  });

  test("logged in user sees correct dashboard", () => {
    // regular user logs in
    useAuth.mockReturnValue([{ user: mockUser }]);
    const { rerender } = renderComponent();

    fireEvent.click(screen.getByRole("link", { name: /dashboard/i }));
    expect(screen.getByTestId("url-pathname")).toHaveTextContent(
      "/dashboard/user"
    );

    // admin user logs in
    useAuth.mockReturnValue([{ user: mockAdmin }]);
    rerender(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter>
              <Header />
              <TestPathname />
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole("link", { name: /dashboard/i }));
    expect(screen.getByTestId("url-pathname")).toHaveTextContent(
      "/dashboard/admin"
    );
  });

  test("search input integration", async () => {
    axios.get.mockResolvedValueOnce({ data: [{ name: "name1" }] });
    renderComponent();

    const searchInput = screen.getByPlaceholderText("Search");

    fireEvent.change(searchInput, { target: { value: "name1" } });
    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() =>
      expect(screen.getByTestId("url-pathname")).toHaveTextContent("/search")
    );
  });
});
