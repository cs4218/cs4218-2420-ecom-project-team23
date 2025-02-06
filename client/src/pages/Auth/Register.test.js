import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Register from "./Register";

// Mocking axios.post
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// prevent jest from crashing
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

describe("Register Component", () => {
  const defaultRegisterUser = {
    name: "John Doe",
    email: "example@gmail.com",
    password: "password",
    phone: "91234567",
    address: "Example Street",
    answer: "Example Answer",
    dob: "2000-01-01",
  };

  const fillForm = (getByPlaceholderText, user) => {
    fireEvent.change(getByPlaceholderText("Enter Your Name"), {
      target: { value: user.name },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: user.email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), {
      target: { value: user.password },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
      target: { value: user.phone },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Address"), {
      target: { value: user.address },
    });
    fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
      target: { value: user.dob },
    });
    fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
      target: { value: user.answer },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register the user successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fillForm(getByPlaceholderText, defaultRegisterUser);
    fireEvent.click(getByText("REGISTER"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(
      "Register Successfully, please login"
    );
  });

  it("should show error if axios fails", async () => {
    const expectedFailureMessage = "axios failed";
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: expectedFailureMessage },
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fillForm(getByPlaceholderText, defaultRegisterUser);
    fireEvent.click(getByText("REGISTER"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(expectedFailureMessage);
  });

  it("should display error message on failed registration", async () => {
    axios.post.mockRejectedValueOnce({ message: "User already exists" });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fillForm(getByPlaceholderText, defaultRegisterUser);
    fireEvent.click(getByText("REGISTER"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });
});
