/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import CreateProduct from "./CreateProduct";

jest.mock("axios");

// Mock Ant Design components
jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  Select: ({ children, onChange }) => (
    <select data-testid="mock-select" onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  ),
  Option: ({ children, value }) => <option value={value}>{children}</option>,
}));

jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

describe("CreateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the create product page and fetches categories", async () => {
    const mockCategories = [
      { _id: "cat1", name: "Electronics" },
      { _id: "cat2", name: "Fashion" },
    ];

    axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      expect(screen.getByText("Create Product")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Fashion")).toBeInTheDocument();
    });
  });

  it("selects a category from the dropdown", async () => {
    const mockCategories = [
      { _id: "cat1", name: "Electronics" },
      { _id: "cat2", name: "Fashion" },
    ];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Electronics"));

    const select = screen.getByTestId("mock-select");
    fireEvent.change(select, { target: { value: "cat1" } });

    expect(select.value).toBe("cat1");
  });

  it("uploads a product image", async () => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    const file = new File(["sample"], "sample.png", { type: "image/png" });
    const input = screen.getByLabelText("Upload Photo");

    fireEvent.change(input, { target: { files: [file] } });

    expect(input.files[0]).toBe(file);
    expect(input.files).toHaveLength(1);
  });

  it("fills in product details", async () => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText("write a name");
    const descInput = screen.getByPlaceholderText("write a description");
    const priceInput = screen.getByPlaceholderText("write a Price");
    const quantityInput = screen.getByPlaceholderText("write a quantity");

    userEvent.type(nameInput, "New Product");
    userEvent.type(descInput, "This is a test product.");
    userEvent.type(priceInput, "199");
    userEvent.type(quantityInput, "5");

    expect(nameInput).toHaveValue("New Product");
    expect(descInput).toHaveValue("This is a test product.");
    expect(priceInput).toHaveValue(199);
    expect(quantityInput).toHaveValue(5);
  });

  it("submits the product form", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText("write a name");
    const descInput = screen.getByPlaceholderText("write a description");
    const priceInput = screen.getByPlaceholderText("write a Price");
    const quantityInput = screen.getByPlaceholderText("write a quantity");
    const submitButton = screen.getByText("CREATE PRODUCT");

    userEvent.type(nameInput, "New Product");
    userEvent.type(descInput, "This is a test product.");
    userEvent.type(priceInput, "199");
    userEvent.type(quantityInput, "5");

    userEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/create-product",
        expect.any(FormData)
      );
    });
  });
});
