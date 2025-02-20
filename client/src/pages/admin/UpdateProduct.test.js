/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UpdateProduct from "./UpdateProduct";

jest.mock("axios");

jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

describe("UpdateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the update product page and fetches product & categories", async () => {
    const mockProduct = {
      product: {
        _id: "prod1",
        name: "Product 1",
        description: "Description of Product 1",
        price: 100,
        quantity: 10,
        shipping: 1,
        category: { _id: "cat1", name: "Category 1" },
      },
    };

    const mockCategories = [
      { _id: "cat1", name: "Category 1" },
      { _id: "cat2", name: "Category 2" },
    ];

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
      if (url === "/api/v1/product/get-product/product-1") {
        return Promise.resolve({ data: mockProduct });
      }
      return Promise.reject(new Error("Invalid request"));
    });

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/product-1"]}>
        <Routes>
          <Route path="/dashboard/admin/update-product/:slug" element={<UpdateProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      expect(screen.getByText("Update Product")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Product 1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Description of Product 1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
      expect(screen.getByText("Category 1")).toBeInTheDocument();
    });
  });

  it("updates a product when form is submitted", async () => {
    const mockProduct = {
      product: {
        _id: "prod1",
        name: "Product 1",
        description: "Description of Product 1",
        price: 100,
        quantity: 10,
        shipping: 1,
        category: { _id: "cat1", name: "Category 1" },
      },
    };

    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/product-1"]}>
        <Routes>
          <Route path="/dashboard/admin/update-product/:slug" element={<UpdateProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue("Product 1"));

    const mockUpdatedCategory = { _id: "cat2", name: "Category 2" };

    const nameInput = screen.getByPlaceholderText("write a name");
    fireEvent.change(nameInput, { target: { value: "Updated Product" } });

    const productUpdatePayload = new FormData();
    productUpdatePayload.append("name", "Updated Product");
    productUpdatePayload.append("category", mockUpdatedCategory._id);

    const updateButton = screen.getByText("UPDATE PRODUCT");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/prod1",
        expect.objectContaining({
          append: expect.any(Function),
        })
      );
    });
  });

  it("deletes a product when delete button is clicked", async () => {
    const mockProduct = {
      product: {
        _id: "prod1",
        name: "Product 1",
        description: "Description of Product 1",
        price: 100,
        quantity: 10,
        shipping: 1,
        category: { _id: "cat1", name: "Category 1" },
      },
    };
  
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
  
    jest.spyOn(window, "prompt").mockImplementation(() => "Yes");
  
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/product-1"]}>
        <Routes>
          <Route path="/dashboard/admin/update-product/:slug" element={<UpdateProduct />} />
        </Routes>
      </MemoryRouter>
    );
  
    await waitFor(() => screen.getByDisplayValue("Product 1"));
  
    const deleteButton = screen.getByText("DELETE PRODUCT");
  
    fireEvent.click(deleteButton);
  
    await waitFor(() => {
      expect(window.prompt).toHaveBeenCalledWith("Are You Sure want to delete this product ? ");
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/product/delete-product/prod1");
    });

    window.prompt.mockRestore();
  });  
});
