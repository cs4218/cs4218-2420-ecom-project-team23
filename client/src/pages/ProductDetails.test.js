/* eslint-disable testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import ProductDetails from "../pages/ProductDetails";
import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";

jest.mock("axios");

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("ProductDetails Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders product details correctly", async () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      description: "Description of Product 1",
      price: 100,
      category: { _id: "cat123", name: "Category1" },
      slug: "test-product",
    };

    const mockRelatedProducts = [
      {
        _id: "2",
        name: "Related Product",
        description: "Another description",
        price: 50,
        slug: "related-product",
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url.includes("get-product")) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes("related-product")) {
        return Promise.resolve({ data: { products: mockRelatedProducts } });
      }
      return Promise.reject(new Error("Not Found"));
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/test-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(await screen.findByText(/Name :\s*Product 1/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Description :\s*Description of Product 1/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/Price :\s*\$100\.00/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Category :\s*Category1/i)
    ).toBeInTheDocument();

    // Verify related product
    await waitFor(() => {
      expect(screen.getByText("Related Product")).toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    axios.get.mockRejectedValue(new Error("Network Error"));

    jest.spyOn(console, "log").mockImplementation(() => {});

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/test-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(await screen.findByText("Product Details")).toBeInTheDocument();

    expect(screen.queryByText(/Product 1/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Description of Product 1/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/\$100\.00/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Category1/i)).not.toBeInTheDocument();

    console.log.mockRestore();
  });

  it("renders message when no related products are found", async () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      description: "Description of Product 1",
      price: 100,
      category: { _id: "cat123", name: "Category1" },
      slug: "test-product",
    };

    axios.get.mockImplementation((url) => {
      if (url.includes("get-product")) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes("related-product")) {
        return Promise.resolve({ data: { products: [] } });
      }
      return Promise.reject(new Error("Not Found"));
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/test-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(
      await screen.findByText("No Similar Products found")
    ).toBeInTheDocument();
  });

  it("navigates to related product details when clicking More Details", async () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      description: "Description of Product 1",
      price: 100,
      category: { _id: "cat123", name: "Category1" },
      slug: "test-product",
    };

    const mockRelatedProducts = [
      {
        _id: "2",
        name: "Related Product",
        description: "Another description",
        price: 50,
        slug: "related-product",
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url.includes("get-product")) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes("related-product")) {
        return Promise.resolve({ data: { products: mockRelatedProducts } });
      }
      return Promise.reject(new Error("Not Found"));
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/test-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route
              path="/product/related-product"
              element={<div>Related Product Page</div>}
            />
          </Routes>
        </MemoryRouter>
      );
    });

    const moreDetailsButton = await screen.findByText("More Details");
    fireEvent.click(moreDetailsButton);

    await waitFor(() => {
      expect(screen.getByText("Related Product Page")).toBeInTheDocument();
    });
  });
});
