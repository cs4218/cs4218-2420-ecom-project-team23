/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import CreateProduct from "./CreateProduct";

// ✅ Mock API calls
jest.mock("axios", () => ({
  get: jest.fn(() =>
    Promise.resolve({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" }, // Pre-defined category
        ],
      },
    })
  ),
  post: jest.fn(() =>
    Promise.resolve({
      data: { success: true, message: "Product Created Successfully" },
    })
  ),
}));

// ✅ Mock dependencies like Layout & AdminMenu
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));

// ✅ Mock context dependencies
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [[]]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => ["", jest.fn()]),
}));

// ✅ Simple test to check if the component renders
test("renders CreateProduct page", async () => {
  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>
  );

  expect(await screen.findByText("Create Product")).toBeInTheDocument();
});

// test("fills out and submits the form", async () => {
//   render(
//     <MemoryRouter>
//       <CreateProduct />
//     </MemoryRouter>
//   );

//   // ✅ Fill out the form fields
//   fireEvent.change(screen.getByPlaceholderText("write a name"), {
//     target: { value: "Test Product" },
//   });
//   fireEvent.change(screen.getByPlaceholderText("write a description"), {
//     target: { value: "This is a test product." },
//   });
//   fireEvent.change(screen.getByPlaceholderText("write a Price"), {
//     target: { value: "100" },
//   });
//   fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
//     target: { value: "10" },
//   });

//   // ✅ **Force the category value to "Books"**
//   const categoryInput = screen.getByLabelText("Category");
//   fireEvent.change(categoryInput, { target: { value: "Books" } });

//   // ✅ **Force the shipping option to "No"**
//   const shippingInput = screen.getByLabelText("Shipping");
//   fireEvent.change(shippingInput, { target: { value: "No" } });

//   // ✅ Mock file upload
//   const fileInput = screen.getByLabelText(/Upload Photo/i);
//   const file = new File(["dummy content"], "test.jpg", { type: "image/jpeg" });
//   fireEvent.change(fileInput, { target: { files: [file] } });

//   // ✅ Click the create button
//   fireEvent.click(screen.getByText(/CREATE PRODUCT/i));

//   // ✅ Ensure axios.post was called
//   await waitFor(() => expect(axios.post).toHaveBeenCalled());
//   expect(axios.post).toHaveBeenCalledWith(
//     "/api/v1/product/create-product",
//     expect.any(FormData)
//   );
// });
