import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { BrowserRouter } from "react-router-dom"; // required for <Link>
import useCategory from "../hooks/useCategory";
import Categories from "./Categories";

jest.mock("../hooks/useCategory.js");

jest.mock("../components/Layout.js", () => ({ children }) => (
  <div>{children}</div>
));

describe("Categories Page Test", () => {
  it("should display the categories successfully", async () => {
    const mockCategories = [
      { _id: "category1", name: "Book", slug: "book" },
      { _id: "category2", name: "Clothing", slug: "clothing" },
      { _id: "category3", name: "Electronics", slug: "electronics" },
    ];
    useCategory.mockReturnValue(mockCategories);

    render(
      <BrowserRouter> 
        <Categories />
      </BrowserRouter>
    );

    expect(screen.getByText("Book")).toBeInTheDocument();
    expect(screen.getByText("Clothing")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();

    // Check if links have correct href attributes
    expect(screen.getByText("Book").closest("a")).toHaveAttribute("href", "/category/book");
    expect(screen.getByText("Clothing").closest("a")).toHaveAttribute("href", "/category/clothing");
    expect(screen.getByText("Electronics").closest("a")).toHaveAttribute("href", "/category/electronics");
  });
});
