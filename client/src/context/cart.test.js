import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { useCart, CartProvider } from "./cart";

const TestComponent = () => {
  const [cart, setCart] = useCart();

  return (
    <div>
      <div data-testid="cart-length">Cart Length: {cart.length}</div>
      <button
        data-testid="add-item-button"
        onClick={() => setCart([...cart, "newItem"])}
      >
        Add Item
      </button>
    </div>
  );
};

describe("Cart Context Test", () => {
  beforeEach(() => {
    localStorage.removeItem("cart");
  });

  it("should initialize with an empty cart when localStorage for cart is empty", async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("cart-length")).toHaveTextContent(
        "Cart Length: 0"
      )
    );
  });

  it("should load cart from localStorage if available", async () => {
    const storedCart = ["Black Lotus"];
    localStorage.setItem("cart", JSON.stringify(storedCart));

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("cart-length")).toHaveTextContent(
        "Cart Length: 1"
      )
    );
  });

  it("should update the cart when setCart is called", async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // waitFor needed here because of the state update in useEffect in cartProvider
    await waitFor(() =>
      expect(screen.getByTestId("cart-length")).toHaveTextContent(
        "Cart Length: 0"
      )
    );

    fireEvent.click(screen.getByTestId("add-item-button"));

    // waitFor needed here because of the state update in clicking the button in TestComponent
    await waitFor(() =>
      expect(screen.getByTestId("cart-length")).toHaveTextContent(
        "Cart Length: 1"
      )
    );
  });
});
