import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { useSearch } from "../../context/search";
import SearchInput from "./SearchInput";
import "@testing-library/jest-dom";

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("axios");

describe("SearchInput Component", () => {
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

  it("renders input field and button", () => {
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("updates input field on change", async () => {
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "Laptop" } });

    await waitFor(() =>
      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: "Laptop",
        results: [],
      })
    );
  });

  it("submits form and handles API success", async () => {
    axios.get.mockResolvedValueOnce({ data: [{ name: "Laptop" }] });

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "Laptop" } });

    const form = screen.getByRole("search");
    fireEvent.submit(form);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/Laptop")
    );
    await waitFor(() =>
      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: "Laptop",
        results: [{ name: "Laptop" }],
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });

  it("handles API failure gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "Laptop" } });

    const form = screen.getByRole("search");
    fireEvent.submit(form);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/Laptop")
    );

    await waitFor(() =>
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error))
    );

    expect(mockSetValues).not.toHaveBeenCalledWith(
      expect.objectContaining({ results: [{ name: "Laptop" }] })
    );
    expect(mockNavigate).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });
});
