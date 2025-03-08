/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  render,
  waitFor,
  screen,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import CreateCategory from "./CreateCategory";
import toast from "react-hot-toast";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
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

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock(
  "../../components/Form/CategoryForm",
  () =>
    ({ handleSubmit, value, setValue }) =>
      (
        <form data-testid="category-form" onSubmit={handleSubmit}>
          <input
            data-testid="category-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit">Submit</button>
        </form>
      )
);

describe("CreateCategory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the category management page and fetches categories", async () => {
    const mockCategories = [
      { _id: "cat1", name: "Electronics" },
      { _id: "cat2", name: "Fashion" },
    ];

    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
    });

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

  it("creates a new category when form is submitted", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    await act(async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
    });

    const input = screen.getAllByTestId("category-input")[0];

    await act(async () => {
      userEvent.type(input, "Books");
    });

    const submitButton = screen.getAllByText("Submit")[0];

    await act(async () => {
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "Books" }
      );
    });
  });

  it("opens the modal and updates a category", async () => {
    const mockCategories = [{ _id: "cat1", name: "Electronics" }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    await act(async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText("Electronics"));

    const editButton = screen.getByText("Edit");

    await act(async () => {
      userEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    });

    const modalInput = screen.getAllByTestId("category-input")[1];

    await act(async () => {
      userEvent.clear(modalInput);
      userEvent.type(modalInput, "Updated Electronics");
    });

    const modalSubmitButton = screen.getAllByText("Submit")[1];

    await act(async () => {
      userEvent.click(modalSubmitButton);
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/cat1",
        { name: "Updated Electronics" }
      );
    });
  });

  it("deletes a category when delete button is clicked", async () => {
    const mockCategories = [{ _id: "cat1", name: "Electronics" }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    await act(async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText("Electronics"));

    const deleteButton = screen.getByText("Delete");

    await act(async () => {
      userEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/cat1"
      );
    });
  });

  it("shows an error if fetching categories fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch categories"));

    await act(async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Manage Category")).toBeInTheDocument();
      expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
      expect(screen.queryByText("Fashion")).not.toBeInTheDocument();
      expect(axios.get).toHaveBeenCalled();
    });
  });

  it("shows an error if category creation fails", async () => {
    axios.post.mockRejectedValueOnce(new Error("Failed to create category"));

    await act(async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
    });

    const input = screen.getAllByTestId("category-input")[0];

    await act(async () => {
      userEvent.type(input, "New Category");
    });

    const submitButton = screen.getAllByText("Submit")[0];

    await act(async () => {
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "New Category" }
      );
      expect(toast.error).toHaveBeenCalledWith(
        "somthing went wrong in input form"
      );
    });

    expect(screen.queryByText("New Category")).not.toBeInTheDocument();
  });

  it("shows an error if category creation fails due to API returning success: false", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Category creation failed" },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    const input = screen.getAllByTestId("category-input")[0];

    await act(async () => {
      userEvent.type(input, "New Category");
    });

    const submitButton = screen.getAllByText("Submit")[0];

    await act(async () => {
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "New Category" }
      );
      expect(toast.error).toHaveBeenCalledWith("Category creation failed");
    });
  });

  it("shows an error if updating a category fails", async () => {
    const mockCategories = [{ _id: "cat1", name: "Electronics" }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.put.mockRejectedValueOnce(new Error("Failed to update category"));

    await act(async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText("Electronics"));

    const editButton = screen.getByText("Edit");

    await act(async () => {
      userEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    });

    const modalInput = screen.getAllByTestId("category-input")[1];

    await act(async () => {
      userEvent.clear(modalInput);
      userEvent.type(modalInput, "Updated Electronics");
    });

    const modalSubmitButton = screen.getAllByText("Submit")[1];

    await act(async () => {
      userEvent.click(modalSubmitButton);
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/cat1",
        { name: "Updated Electronics" }
      );
    });

    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
  });

  it("shows an error if updating a category fails due to API returning success: false", async () => {
    const mockCategories = [{ _id: "cat1", name: "Electronics" }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.put.mockResolvedValueOnce({
      data: { success: false, message: "Update failed" },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Electronics"));

    const editButton = screen.getByText("Edit");

    await act(async () => {
      userEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    });

    const modalInput = screen.getAllByTestId("category-input")[1];

    await act(async () => {
      userEvent.clear(modalInput);
      userEvent.type(modalInput, "Updated Electronics");
    });

    const modalSubmitButton = screen.getAllByText("Submit")[1];

    await act(async () => {
      userEvent.click(modalSubmitButton);
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/cat1",
        { name: "Updated Electronics" }
      );
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  it("shows an error if deleting a category fails", async () => {
    const mockCategories = [{ _id: "cat1", name: "Electronics" }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.delete.mockRejectedValueOnce(new Error("Failed to delete category"));

    await act(async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText("Electronics"));

    const deleteButton = screen.getByText("Delete");

    await act(async () => {
      userEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/cat1"
      );
    });

    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("shows an error if deleting a category fails due to API returning success: false", async () => {
    const mockCategories = [{ _id: "cat1", name: "Electronics" }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Simulate a successful API call that returns success: false
    axios.delete.mockResolvedValueOnce({
      data: { success: false, message: "Delete failed" },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Electronics"));

    const deleteButton = screen.getByText("Delete");

    await act(async () => {
      userEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/cat1"
      );
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });
  });

  it("closes the modal when close button is clicked", async () => {
    const mockCategories = [{ _id: "cat1", name: "Electronics" }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText("Electronics"));

    const editButton = screen.getByText("Edit");

    await act(async () => {
      userEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId("close-modal");

    await act(async () => {
      userEvent.click(closeButton);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
    });
  });
});
