import React from "react";
import { render, act, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { useAuth } from "../../context/auth";
import moment from "moment";
import Orders from "./Orders";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/UserMenu", () => () => {
  <div />;
});

describe("Orders Component", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "1",
          status: "Shipped",
          buyer: { name: "John Doe" },
          createdAt: "2024-01-01T12:00:00Z",
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Black Rose",
              price: 10,
              description: "Live in the moment",
            },
            {
              _id: "p2",
              name: "Infinity Shield",
              price: 30,
              description: "Protect against inside",
            },
          ],
        },
        {
          _id: "2",
          status: "Shipped",
          buyer: { name: "John Doe" },
          createdAt: "2025-01-01T12:00:00Z",
          payment: { success: false },
          products: [
            {
              _id: "p3",
              name: "Fountain of youth",
              price: 100,
              description: "Drink to be immortal",
            },
            {
              _id: "p4",
              name: "Peace of Mind",
              price: 300,
              description: "For your peace of mind",
            },
          ],
        },
      ],
    });
    useAuth.mockReturnValue([
      {
        token: "fake-token",
      },
      jest.fn(),
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch orders on mount", async () => {
    await act(async () => {
      render(<Orders />);
    });

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
  });

  it("should not fetch orders if user is not authenticated", async () => {
    useAuth.mockReturnValue([null, jest.fn()]);

    await act(async () => {
      render(<Orders />);
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("should render order details correctly", async () => {
    await act(async () => {
      render(<Orders />);
    });

    expect(screen.getByText("Black Rose")).toBeInTheDocument();
    expect(screen.getByText("Price : 10")).toBeInTheDocument();
    expect(screen.getByText("Live in the moment")).toBeInTheDocument();
    expect(screen.getByText("Infinity Shield")).toBeInTheDocument();
    expect(screen.getByText("Price : 30")).toBeInTheDocument();
    expect(screen.getByText("Protect against inside")).toBeInTheDocument();
    expect(screen.getByText("Fountain of youth")).toBeInTheDocument();
    expect(screen.getByText("Price : 100")).toBeInTheDocument();
    expect(screen.getByText("Drink to be immortal")).toBeInTheDocument();
    expect(screen.getByText("Peace of Mind")).toBeInTheDocument();
    expect(screen.getByText("Price : 300")).toBeInTheDocument();
    expect(screen.getByText("For your peace of mind")).toBeInTheDocument();
  });

  it("should render empty orders list correctly", async () => {
    axios.get.mockResolvedValue({ data: [] });

    await act(async () => {
      render(<Orders />);
    });

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });

  it("should format order date correctly", async () => {
    const testDate = moment().subtract(2, "days").toISOString();

    axios.get.mockResolvedValue({
      data: [
        {
          _id: "1",
          status: "Shipped",
          buyer: { name: "John Doe" },
          createdAt: testDate,
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Black Rose",
              price: 10,
              description: "Live in the moment",
            },
          ],
        },
      ],
    });

    await act(async () => {
      render(<Orders />);
    });

    expect(screen.getByText("2 days ago")).toBeInTheDocument();
  });
});
