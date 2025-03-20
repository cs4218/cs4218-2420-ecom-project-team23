import "@testing-library/jest-dom/extend-expect";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "./Layout";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";

describe("Layout Component Integration Test", () => {
  const mockCustomProps = {
    title: "Custom title",
    description: "Custom description",
    keywords: "Custom keywords",
    author: "Custom author",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all components correctly", () => {
    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter>
              <Layout {...mockCustomProps}>Child</Layout>
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );
    const logoLink = screen.getByRole("link", { name: /🛒 Virtual Vault/i });

    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(logoLink).toBeInTheDocument();

  });
});
