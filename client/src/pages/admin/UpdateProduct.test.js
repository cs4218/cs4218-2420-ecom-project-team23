/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UpdateProduct from "./UpdateProduct";
import toast from "react-hot-toast";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

describe("UpdateProduct Component", () => {
  let mockProduct;
  let mockCategories;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});

    mockProduct = {
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

    mockCategories = [
      { _id: "cat1", name: "Category 1" },
      { _id: "cat2", name: "Category 2" },
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the update product page and fetches product & categories", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      if (url.includes("/api/v1/product/get-product/product-1")) {
        return Promise.resolve({ data: mockProduct });
      }
      return Promise.reject(new Error("Invalid request"));
    });

    render(
      <MemoryRouter
        initialEntries={["/dashboard/admin/update-product/product-1"]}
      >
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Update Product"));
    await waitFor(() => screen.getByDisplayValue("Product 1"));
  });

  it("updates a product when form is submitted", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter
        initialEntries={["/dashboard/admin/update-product/product-1"]}
      >
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue("Product 1"));

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Updated Product" },
    });
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/prod1",
        expect.objectContaining({
          append: expect.any(Function),
        })
      );
    });
  });

  // it("handles error when updating product fails", async () => {
  //   // Mock console.error to suppress expected error logs
  //   const consoleErrorMock = jest
  //     .spyOn(console, "error")
  //     .mockImplementation(() => {});

  //   const mockProduct = {
  //     product: {
  //       _id: "prod1",
  //       name: "Product 1",
  //       description: "Description of Product 1",
  //       price: 100,
  //       quantity: 10,
  //       shipping: 1,
  //       category: { _id: "cat1", name: "Category 1" },
  //     },
  //   };

  //   // Mock API responses
  //   axios.get.mockResolvedValueOnce({ data: mockProduct });
  //   axios.put.mockRejectedValueOnce(new Error("Update failed"));

  //   render(
  //     <MemoryRouter initialEntries={["/dashboard/admin/update-product/prod1"]}>
  //       <Routes>
  //         <Route
  //           path="/dashboard/admin/update-product/:slug"
  //           element={<UpdateProduct />}
  //         />
  //       </Routes>
  //     </MemoryRouter>
  //   );

  //   // Ensure the page loads
  //   await waitFor(() => {
  //     expect(screen.getByText("Update Product")).toBeInTheDocument();
  //   });

  //   // Click the "UPDATE PRODUCT" button
  //   fireEvent.click(screen.getByText("UPDATE PRODUCT"));

  //   // Wait for the API call to be made
  //   await waitFor(() => {
  //     expect(axios.put).toHaveBeenCalled();
  //   });

  //   // Restore console.error after the test
  //   consoleErrorMock.mockRestore();
  // });

  it("deletes a product when delete button is clicked", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    const promptMock = jest.spyOn(window, "prompt").mockReturnValue("Yes");

    render(
      <MemoryRouter
        initialEntries={["/dashboard/admin/update-product/product-1"]}
      >
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
          <Route
            path="/dashboard/admin/products"
            element={<div>Redirected</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue("Product 1"));
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    expect(promptMock).toHaveBeenCalledWith(
      "Are you sure want to delete this product? "
    );

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/product/delete-product/prod1"
      );
      expect(screen.getByText("Redirected")).toBeInTheDocument();
    });

    promptMock.mockRestore();
  });

  it("handles error when deleting product fails", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.delete.mockRejectedValueOnce(new Error("Delete failed"));

    const promptMock = jest.spyOn(window, "prompt").mockReturnValue("Yes");

    render(
      <MemoryRouter
        initialEntries={["/dashboard/admin/update-product/product-1"]}
      >
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Update Product"));
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    promptMock.mockRestore();
  });

  it("shows an error if required fields are missing", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/prod1"]}>
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Update Product"));

    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });
});
