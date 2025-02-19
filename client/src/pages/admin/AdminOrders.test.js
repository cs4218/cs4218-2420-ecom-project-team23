/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import AdminOrders from "./AdminOrders";
import { useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  Select: ({ value, onChange }) => (
    <select data-testid="mock-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="Processing">Processing</option>
      <option value="Shipped">Shipped</option>
      <option value="Delivered">Delivered</option>
      <option value="Cancelled">Cancelled</option>
    </select>
  ),
}));

jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

describe("AdminOrders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the admin orders page with fetched orders", async () => {
    const mockOrders = [
      {
        _id: "order1",
        status: "Processing",
        buyer: { name: "John Doe" },
        createAt: new Date().toISOString(),
        payment: { success: true },
        products: [
          { _id: "product1", name: "Laptop", description: "A powerful laptop", price: 1000 },
        ],
      },
    ];

    useAuth.mockReturnValue([{ token: "mockToken" }]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      expect(screen.getByText("All Orders")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Processing")).toBeInTheDocument();
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Price : 1000")).toBeInTheDocument();
    });
  });

  it("updates order status when changed", async () => {
    const mockOrders = [
      {
        _id: "order1",
        status: "Processing",
        buyer: { name: "John Doe" },
        createAt: new Date().toISOString(),
        payment: { success: true },
        products: [{ _id: "product1", name: "Laptop", description: "A powerful laptop", price: 1000 }],
      },
    ];

    useAuth.mockReturnValue([{ token: "mockToken" }]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("John Doe"));

    const selectDropdown = screen.getByTestId("mock-select");
    expect(selectDropdown).toBeInTheDocument();

    await userEvent.selectOptions(selectDropdown, "Shipped");

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order1", { status: "Shipped" });
    });
  });

  it("displays no orders message when API returns an empty list", async () => {
    useAuth.mockReturnValue([{ token: "mockToken" }]);
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });
});
