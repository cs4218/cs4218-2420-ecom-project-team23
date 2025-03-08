import React from "react";
import { render, screen, act } from "@testing-library/react";
import { SearchProvider, useSearch } from "../context/search";
import "@testing-library/jest-dom";

const TestChild = () => {
  const [search, setSearch] = useSearch();

  const handleSearch = () => {
    setSearch({
      keyword: "test keyword",
      results: ["result1", "result2"],
    });
  };

  return (
    <div>
      <p data-testid="keyword">Keyword: {search.keyword}</p>
      <p data-testid="results">Results: {search.results.join(", ")}</p>
      <button onClick={handleSearch}>Update Search</button>
    </div>
  );
};

const renderPage = () => {
  return render(
    <SearchProvider>
      <TestChild />
    </SearchProvider>
  );
};

describe("Search Context", () => {
  it("should initially have empty keyword and results", () => {
    renderPage();

    expect(screen.getByTestId("keyword")).toHaveTextContent(/^Keyword:\s*$/);
    expect(screen.getByTestId("results")).toHaveTextContent(/^Results:\s*$/);
  });

  it("should update keyword and results when setSearch is called", () => {
    renderPage();

    const updateButton = screen.getByText(/^Update Search$/);

    act(() => {
      updateButton.click();
    });

    expect(screen.getByTestId("keyword")).toHaveTextContent(
      /^Keyword:\s*test keyword$/
    );
    expect(screen.getByTestId("results")).toHaveTextContent(
      /^Results:\s*result1,\s*result2$/
    );
  });
});
