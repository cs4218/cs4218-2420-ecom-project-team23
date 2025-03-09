/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import CreateProduct from "./CreateProduct";
import toast from "react-hot-toast";
import userEvent from "@testing-library/user-event";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe("CreateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  beforeAll(() => {
    global.URL.createObjectURL = jest.fn();
  });

  it("renders CreateProduct page", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" },
        ],
      },
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    expect(await screen.findByText("Create Product")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
  });

  it("handles successful product creation", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });

    axios.post.mockResolvedValueOnce({ data: { success: true } });

    jest.spyOn(React, "useState").mockImplementation((initialValue) => {
      if (initialValue === "") {
        return ["1", jest.fn()];
      }
      if (initialValue === "") {
        return ["1", jest.fn()];
      }
      return [initialValue, jest.fn()];
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Create Product"));

    userEvent.type(screen.getByPlaceholderText("write a name"), "New Laptop");
    userEvent.type(
      screen.getByPlaceholderText("write a description"),
      "A powerful laptop"
    );
    userEvent.type(screen.getByPlaceholderText("write a Price"), "1500");
    userEvent.type(screen.getByPlaceholderText("write a quantity"), "5");
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  it("handles failed product creation (success: false)", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });

    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Product creation failed" },
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Create Product"));

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "New Laptop" },
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  it("handles failed product creation (success: true)", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });

    //axios.post.mockRejectedValueOnce(new Error("Server error"));

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Create Product"));

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      //expect(toast.error).toHaveBeenCalledWith("something went wrong"); // FIX: Ensure toast error is captured
    });
  });

  it("handles API failure when fetching categories", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something wwent wrong in getting catgeory"
      );
    });
  });

  it("does not submit if required fields are missing", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Create Product"));

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.any(String));
    });
  });

  it("allows the user to upload an image", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Create Product"));

    const file = new File(["dummy content"], "test-image.jpg", {
      type: "image/jpeg",
    });

    const fileInput = screen.getByLabelText(/Upload Photo/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
