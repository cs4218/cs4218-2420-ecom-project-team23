/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import CreateCategory from "./CreateCategory";

jest.mock("axios");
jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  Modal: ({ visible, onCancel, children }) =>
    visible ? (
      <div data-testid="mock-modal">
        {children}
        <button onClick={onCancel} data-testid="close-modal">
          Close
        </button>
      </div>
    ) : null,
}));

jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

jest.mock("../../components/Form/CategoryForm", () => ({ handleSubmit, value, setValue }) => (
  <form data-testid="category-form" onSubmit={handleSubmit}>
    <input
      data-testid="category-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
    <button type="submit">Submit</button>
  </form>
));

describe("CreateCategory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the category management page and fetches categories", async () => {
    const mockCategories = [
      { _id: "cat1", name: "Electronics" },
      { _id: "cat2", name: "Fashion" },
    ];

    axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      expect(screen.getByText("Manage Category")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Fashion")).toBeInTheDocument();
    });
  });

  // Test creating a new category
  it("creates a new category when form is submitted", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    const input = screen.getAllByTestId("category-input")[0];
    userEvent.type(input, "Books");

    const submitButton = screen.getAllByText("Submit")[0];
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "Books" });
    });
  });

  // Tests updating a category
  it("opens the modal and updates a category", async () => {
    const mockCategories = [{ _id: "cat1", name: "Electronics" }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Electronics"));
    const editButton = screen.getByText("Edit");
    userEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    });

    const modalInput = screen.getAllByTestId("category-input")[1];
    userEvent.clear(modalInput);
    userEvent.type(modalInput, "Updated Electronics");

    const modalSubmitButton = screen.getAllByText("Submit")[1];
    userEvent.click(modalSubmitButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/cat1", { name: "Updated Electronics" });
    });
  });

  // Tests deleting a category
  it("deletes a category when delete button is clicked", async () => {
    const mockCategories = [{ _id: "cat1", name: "Electronics" }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Electronics"));

    const deleteButton = screen.getByText("Delete");
    userEvent.click(deleteButton);
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/cat1");
    });
  });
});
