import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useSearch } from "../context/search";
import Search from "../pages/Search";
import "@testing-library/jest-dom";

jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../components/Layout", () => ({ title, children }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
));

describe("Search Page", () => {
  let mockSetValues;
  let mockValues;

  beforeEach(() => {
    mockValues = { keyword: "", results: [] };
    mockSetValues = jest.fn((newValues) =>
      Object.assign(mockValues, newValues)
    );

    useSearch.mockReturnValue([mockValues, mockSetValues]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders search page with default UI", () => {
    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    expect(screen.getByText("Search Results")).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  it("displays search results when products are found", () => {
    const mockProducts = [
      {
        _id: "1",
        name: "Product 1",
        description: "Description of Product 1",
        price: 100,
      },
      {
        _id: "2",
        name: "Product 2",
        description: "Another description",
        price: 200,
      },
    ];

    useSearch.mockReturnValue([
      { keyword: "test", results: mockProducts },
      mockSetValues,
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    expect(screen.getByText("Found 2")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText(/\$ 100/i)).toBeInTheDocument();
    expect(screen.getByText(/\$ 200/i)).toBeInTheDocument();
  });

  it("renders product images correctly", () => {
    const mockProducts = [
      { _id: "1", name: "Test Product", description: "A product", price: 99 },
    ];

    useSearch.mockReturnValue([
      { keyword: "test", results: mockProducts },
      mockSetValues,
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    const productImage = screen.getByAltText("Test Product");
    expect(productImage).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/1"
    );
  });

  it("displays action buttons for each product", () => {
    const mockProducts = [
      { _id: "1", name: "Test Product", description: "A product", price: 99 },
    ];

    useSearch.mockReturnValue([
      { keyword: "test", results: mockProducts },
      mockSetValues,
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    expect(screen.getByText("More Details")).toBeInTheDocument();
    expect(screen.getByText("ADD TO CART")).toBeInTheDocument();
  });
});
