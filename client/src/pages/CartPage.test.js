import React from "react";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CartPage from "./CartPage";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";

jest.mock("braintree-web-drop-in-react");

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("./../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("CartPage Test", () => {
  const mockSetAuth = jest.fn();
  const mockSetCart = jest.fn();
  const mockUseNavigate = jest.fn();

  beforeEach(() => {
    // Need to mock axios.get because of the useEffect calling getToken() in cartPage
    axios.get.mockResolvedValue({ data: { clientToken: "fake-client-token" } });

    useAuth.mockReturnValue([
      {
        user: { name: "fake-name", address: "fake-address" },
        token: "fake-token",
      },
      mockSetAuth,
    ]);
    useCart.mockReturnValue([
      [
        {
          _id: "id1",
          name: "Black Lotus",
          price: 50,
          description: "A black rose shall bloom once more",
        },
        {
          _id: "id2",
          name: "Infinity Gaunlet",
          price: 100,
          description: "I am the only one who knows that",
        },
      ],
      mockSetCart,
    ]);
    useNavigate.mockReturnValue(mockUseNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render 'Hello Guest' if not authenticated", async () => {
    useAuth.mockReturnValue([null, mockSetAuth]);

    // act(async () => {...}) ensures React processes all state updates before running assertions
    await act(async () => {
      render(<CartPage />);
    });

    expect(screen.getByText("Hello Guest")).toBeInTheDocument();
  });

  it("should render user's name if authenticated", async () => {
    await act(async () => {
      render(<CartPage />);
    });

    expect(screen.getByText("Hello fake-name")).toBeInTheDocument();
  });

  it("should display the please login to checkout button if user is not logged in", async () => {
    useAuth.mockReturnValue([null, mockSetAuth]);

    await act(async () => {
      render(<CartPage />);
    });

    expect(screen.getByText("Please Login to checkout")).toBeInTheDocument();
  });

  it("should display the cart empty message if cart is empty", async () => {
    useCart.mockReturnValue([[], mockSetCart]);

    await act(async () => {
      render(<CartPage />);
    });

    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });

  it("should display the correct message when the user has items in the cart and is logged in", async () => {
    await act(async () => {
      render(<CartPage />);
    });

    expect(
      screen.getByText("You have 2 items in your cart")
    ).toBeInTheDocument();
  });

  it("should calculate the total price of all items in cart correctly", async () => {
    await act(async () => {
      render(<CartPage />);
    });

    expect(screen.getByText("Total : $150.00")).toBeInTheDocument();
  });

  // it("should handle erroneous prices for cart items and log them", async () => {
  //   const consoleErrorSpy = jest.spyOn(console, "log");
  //   useCart.mockReturnValue([[{description: "a"}, {description: "b"}], mockSetCart]);

  //   await act(async () => {
  //     render(<CartPage />);
  //   });

  //   expect(consoleErrorSpy).toHaveBeenCalled();
  //   consoleErrorSpy.mockRestore();
  // });

  it("should remove items from cart correctly", async () => {
    render(<CartPage />);

    const removeButton = screen.getAllByText("Remove")[0]; // find the remove button for the first product
    fireEvent.click(removeButton);

    await waitFor(() =>
      expect(mockSetCart).toHaveBeenCalledWith([
        {
          _id: "id2",
          name: "Infinity Gaunlet",
          price: 100,
          description: "I am the only one who knows that",
        },
      ])
    );

    expect(mockSetCart).toHaveBeenCalledTimes(1);
  });

  it("fetches the client token on mount", async () => {
    await act(async () => {
      render(<CartPage />);
    });

    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
  });

  it("should not display the payment button if not logged in", async () => {
    useAuth.mockReturnValue([null, mockSetAuth]);

    await act(async () => {
      render(<CartPage />);
    });

    expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
    expect(screen.queryByText("Processing ....")).not.toBeInTheDocument();
  });

  it("should not display the payment button if cart is empty", async () => {
    useCart.mockReturnValue([[], mockSetCart]);

    await act(async () => {
      render(<CartPage />);
    });

    expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
    expect(screen.queryByText("Processing ....")).not.toBeInTheDocument();
  });

  it("should display the payment button if all conditions are met (is logged in, cart not empty)", async () => {
    await act(async () => {
      render(<CartPage />);
    });

    expect(screen.getByText("Make Payment")).toBeInTheDocument();
  });

  it("should navigate to the profile page when 'Update Address' is clicked", async () => {
    await act(async () => {
      render(<CartPage />);
    });

    fireEvent.click(screen.getByText("Update Address"));
    expect(mockUseNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  it("should navigate to the login page when 'Please Login to checkout' is clicked", async () => {
    useAuth.mockReturnValue([null, mockSetAuth]);

    await act(async () => {
      render(<CartPage />);
    });

    fireEvent.click(screen.getByText("Please Login to checkout"));
    expect(mockUseNavigate).toHaveBeenCalledWith("/login", {
      state: "/cart",
    });
  });

  // it("should handle successful payment", async () => {
  //   await act(async () => {
  //     render(<CartPage />);
  //   });

  //   fireEvent.click(screen.getByText("Make Payment"));
  //   expect(localStorage.getItem("cart")).toBe(null);
  //   expect(screen.getByText("Payment Completed Successfully")).toBeInTheDocument();
  // });

  // it("should handle failed payment", async () => {
  //   render(<CartPage />);
  //   fireEvent.click(screen.getByText("Make Payment"));
  //   expect(screen.getByText("Processing ....")).toBeInTheDocument();
  // });
});
