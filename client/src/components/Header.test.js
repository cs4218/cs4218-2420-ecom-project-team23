import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";
import Header from "./Header";

jest.mock("react-hot-toast");

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

jest.mock("./Form/SearchInput", () => () => (
  <div data-testid="search-input">Search Input</div>
));

describe("Header Component", () => {
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
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders brand name and nav when unauthenticated", () => {
    useAuth.mockReturnValue([null, jest.fn()]);
    renderComponent();

    const logoLink = screen.getByRole("link", { name: /🛒 Virtual Vault/i });
    const homeLink = screen.getByRole("link", { name: /home/i });
    const categoriesLink = screen.getByRole("link", { name: /^categories$/i });
    const allCategoriesLink = screen.getByRole("link", {
      name: /^all categories$/i,
    });
    const registerLink = screen.getByRole("link", { name: /register/i });
    const loginLink = screen.getByRole("link", { name: /login/i });
    const cartLink = screen.getByRole("link", { name: /cart/i });

    // check if all links are rendered
    expect(logoLink).toBeInTheDocument();
    expect(homeLink).toBeInTheDocument();
    expect(categoriesLink).toBeInTheDocument();
    expect(allCategoriesLink).toBeInTheDocument();
    expect(registerLink).toBeInTheDocument();
    expect(loginLink).toBeInTheDocument();
    expect(cartLink).toBeInTheDocument();

    // check if links point to correct routes
    expect(logoLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveAttribute("href", "/");
    expect(categoriesLink).toHaveAttribute("href", "/categories");
    expect(allCategoriesLink).toHaveAttribute("href", "/categories");
    expect(registerLink).toHaveAttribute("href", "/register");
    expect(loginLink).toHaveAttribute("href", "/login");
    expect(cartLink).toHaveAttribute("href", "/cart");
  });

  test("renders SearchInput component", () => {
    renderComponent();

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  test("renders cart when authenticated", async () => {
    useAuth.mockReturnValue([{ user: mockUser }]);
    renderComponent();

    expect(
      screen.queryByRole("link", { name: /register/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /login/i })
    ).not.toBeInTheDocument();

    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /logout/i })).toBeInTheDocument();
  });

  test("cart shows correct counts", () => {
    useCart.mockReturnValue([[1, 2, 3, 4]]);
    const { rerender } = renderComponent();

    expect(screen.getByText(4)).toBeInTheDocument();

    useCart.mockReturnValue([[]]);

    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText(0)).toBeInTheDocument();
  });

  test("shows all categories", () => {
    useCategory.mockReturnValue(mockCategories);
    renderComponent();

    mockCategories.forEach((c) => {
      const categoryLink = screen.getByRole("link", { name: c.name });

      expect(categoryLink).toBeInTheDocument();
      expect(categoryLink).toHaveAttribute("href", `/category/${c.slug}`);
    });
  });

  test("dashboard links points to correct route based on role", () => {
    useAuth.mockReturnValue([{ user: mockUser }]);
    const { rerender } = renderComponent();

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });

    expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");

    useAuth.mockReturnValue([{ user: mockAdmin }]);
    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const adminDashboardLink = screen.getByRole("link", { name: /dashboard/i });

    expect(adminDashboardLink).toHaveAttribute("href", "/dashboard/admin");
  });

  test("logout function works properly", () => {
    const mockSetAuth = jest.fn();
    useAuth.mockReturnValue([
      { user: mockUser, token: "user-token" },
      mockSetAuth,
    ]);
    const localStorageRemoveAuth = jest.spyOn(Storage.prototype, "removeItem");
    renderComponent();

    fireEvent.click(screen.getByRole("link", { name: /logout/i }));

    expect(mockSetAuth).toHaveBeenCalledWith({
      user: null,
      token: "",
    });
    expect(localStorageRemoveAuth).toHaveBeenCalledWith("auth");
    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });
});
