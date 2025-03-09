/* eslint-disable testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import CategoryProduct from "../pages/CategoryProduct";
import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";

jest.mock("axios");

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("CategoryProduct Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders category products correctly", async () => {
    const mockCategory = { _id: "cat123", name: "Electronics" };
    const mockProducts = [
      {
        _id: "1",
        name: "Laptop",
        description: "High-end gaming laptop",
        price: 1500,
        slug: "laptop",
      },
      {
        _id: "2",
        name: "Smartphone",
        description: "Latest model smartphone",
        price: 1000,
        slug: "smartphone",
      },
    ];

    axios.get.mockResolvedValue({
      data: { category: mockCategory, products: mockProducts },
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/category/electronics"]}>
          <Routes>
            <Route path="/category/:slug" element={<CategoryProduct />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(
      await screen.findByText(/Category - Electronics/i)
    ).toBeInTheDocument();
    expect(await screen.findByText("2 result found")).toBeInTheDocument();
    expect(await screen.findByText("Laptop")).toBeInTheDocument();
    expect(await screen.findByText("Smartphone")).toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    axios.get.mockRejectedValue(new Error("Network Error"));

    jest.spyOn(console, "log").mockImplementation(() => {});

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/category/electronics"]}>
          <Routes>
            <Route path="/category/:slug" element={<CategoryProduct />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(await screen.findByText(/Category -/i)).toBeInTheDocument();
    expect(screen.queryByText("result found")).not.toBeInTheDocument();
    expect(screen.queryByText("Laptop")).not.toBeInTheDocument();
    expect(screen.queryByText("Smartphone")).not.toBeInTheDocument();

    console.log.mockRestore();
  });

  it("renders message when no products are found", async () => {
    const mockCategory = { _id: "cat123", name: "Electronics" };

    axios.get.mockResolvedValue({
      data: { category: mockCategory, products: [] },
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/category/electronics"]}>
          <Routes>
            <Route path="/category/:slug" element={<CategoryProduct />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(
      await screen.findByText("Category - Electronics")
    ).toBeInTheDocument();
    expect(await screen.findByText("0 result found")).toBeInTheDocument();
  });

  it("navigates to product details when clicking More Details", async () => {
    const mockCategory = { _id: "cat123", name: "Electronics" };
    const mockProducts = [
      {
        _id: "1",
        name: "Laptop",
        description: "High-end gaming laptop",
        price: 1500,
        slug: "laptop",
      },
    ];

    axios.get.mockResolvedValue({
      data: { category: mockCategory, products: mockProducts },
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/category/electronics"]}>
          <Routes>
            <Route path="/category/:slug" element={<CategoryProduct />} />
            <Route
              path="/product/laptop"
              element={<div>Laptop Product Page</div>}
            />
          </Routes>
        </MemoryRouter>
      );
    });

    const moreDetailsButton = await screen.findByText("More Details");
    fireEvent.click(moreDetailsButton);

    await waitFor(() => {
      expect(screen.getByText("Laptop Product Page")).toBeInTheDocument();
    });
  });
});
