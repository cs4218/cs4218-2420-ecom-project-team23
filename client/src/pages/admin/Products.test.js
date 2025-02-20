/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import Products from "./Products";

jest.mock("axios");

jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

describe("Products Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the products page and fetches products", async () => {
    const mockProducts = [
      {
        _id: "prod1",
        name: "Product 1",
        description: "Description for Product 1",
        slug: "product-1",
      },
      {
        _id: "prod2",
        name: "Product 2",
        description: "Description for Product 2",
        slug: "product-2",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      expect(screen.getByText("All Products List")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Description for Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText("Description for Product 2")).toBeInTheDocument();
    });
  });

  it("displays product cards with correct links", async () => {
    const mockProducts = [
      {
        _id: "prod1",
        name: "Product 1",
        description: "Description for Product 1",
        slug: "product-1",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Product 1"));

    const productLink = screen.getByText("Product 1").closest("a");
    expect(productLink).toHaveAttribute("href", "/dashboard/admin/product/product-1");
  });

  it("displays product images correctly", async () => {
    const mockProducts = [
      {
        _id: "prod1",
        name: "Product 1",
        description: "Description for Product 1",
        slug: "product-1",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Product 1"));

    const productImage = screen.getByAltText("Product 1");
    expect(productImage).toHaveAttribute("src", "/api/v1/product/product-photo/prod1");
  });
});
