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

// Mock Ant Design's Select component
jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  Select: ({ value, onChange, children }) => (
    <select
      data-testid="mock-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  ),
  Option: ({ value, children }) => <option value={value}>{children}</option>,
}));

// Mock other components
jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

describe("CreateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the create product page and fetches categories", async () => {
    const mockCategories = [
      { _id: "cat1", name: "Electronics" },
      { _id: "cat2", name: "Fashion" },
    ];

    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

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

  it("allows the user to select a category", async () => {
    const mockCategories = [
      { _id: "cat1", name: "Electronics" },
      { _id: "cat2", name: "Fashion" },
    ];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Electronics"));

    const select = await screen.findByTestId("mock-select");
    fireEvent.change(select, { target: { value: "cat1" } });

    expect(select.value).toBe("cat1");
  });

  it("allows the user to upload an image", async () => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    const file = new File(["sample"], "sample.png", { type: "image/png" });
    const input = await screen.findByLabelText("Upload Photo");

    fireEvent.change(input, { target: { files: [file] } });

    expect(input.files[0]).toBe(file);
    expect(input.files).toHaveLength(1);
  });

  it("allows the user to fill in product details", async () => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    const nameInput = await screen.findByPlaceholderText("write a name");
    const descInput = await screen.findByPlaceholderText("write a description");
    const priceInput = await screen.findByPlaceholderText("write a Price");
    const quantityInput = await screen.findByPlaceholderText(
      "write a quantity"
    );

    await userEvent.type(nameInput, "New Product");
    await userEvent.type(descInput, "This is a test product.");
    await userEvent.type(priceInput, "199");
    await userEvent.type(quantityInput, "5");

    expect(nameInput).toHaveValue("New Product");
    expect(descInput).toHaveValue("This is a test product.");
    expect(priceInput).toHaveValue("199");
    expect(quantityInput).toHaveValue("5");
  });

  it("submits the product form successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    const nameInput = await screen.findByPlaceholderText("write a name");
    const descInput = await screen.findByPlaceholderText("write a description");
    const priceInput = await screen.findByPlaceholderText("write a Price");
    const quantityInput = await screen.findByPlaceholderText(
      "write a quantity"
    );
    const submitButton = await screen.findByText("CREATE PRODUCT");

    await userEvent.type(nameInput, "New Product");
    await userEvent.type(descInput, "This is a test product.");
    await userEvent.type(priceInput, "199");
    await userEvent.type(quantityInput, "5");

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/create-product",
        expect.any(FormData)
      );
    });
  });
});
