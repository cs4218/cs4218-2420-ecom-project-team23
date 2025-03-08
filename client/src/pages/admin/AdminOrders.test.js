/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
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
    <select
      data-testid="mock-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="Processing">Processing</option>
      <option value="Shipped">Shipped</option>
      <option value="Delivered">Delivered</option>
      <option value="Cancelled">Cancelled</option>
    </select>
  ),
}));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

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
          {
            _id: "product1",
            name: "Laptop",
            description: "A powerful laptop",
            price: 1000,
          },
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

    // Use `findBy*` queries instead of `waitFor` + `getBy*`
    expect(await screen.findByTestId("layout")).toBeInTheDocument();
    expect(await screen.findByTestId("admin-menu")).toBeInTheDocument();
    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(await screen.findByText("Success")).toBeInTheDocument();
    expect(await screen.findByText("Laptop")).toBeInTheDocument();
    expect(await screen.findByText("Price : 1000")).toBeInTheDocument();
  });

  it("updates order status when changed", async () => {
    const mockOrders = [
      {
        _id: "order1",
        status: "Processing",
        buyer: { name: "John Doe" },
        createAt: new Date().toISOString(),
        payment: { success: true },
        products: [
          {
            _id: "product1",
            name: "Laptop",
            description: "A powerful laptop",
            price: 1000,
          },
        ],
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

    await screen.findByText("John Doe");

    const selectDropdown = await screen.findByTestId("mock-select");
    expect(selectDropdown).toBeInTheDocument();

    await userEvent.selectOptions(selectDropdown, "Shipped");

    expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order1", {
      status: "Shipped",
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

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });
});
