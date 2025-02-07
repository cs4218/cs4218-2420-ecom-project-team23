import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "./Login";

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

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

describe("Login Component", () => {
  const defaultLoginDetails = {
    email: "test@example.com",
    password: "password123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form", () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("LOGIN FORM")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
  });

  it("inputs should be initially empty", () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("LOGIN FORM")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(getByPlaceholderText("Enter Your Password").value).toBe("");
  });

  it("should login the user successfully", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: "John Doe", email: "test@example.com" },
        token: "mockToken",
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = getByPlaceholderText("Enter Your Email");
    const passwordInput = getByPlaceholderText("Enter Your Password");

    fireEvent.change(emailInput, {
      target: { value: defaultLoginDetails.email },
    });
    fireEvent.change(passwordInput, {
      target: { value: defaultLoginDetails.password },
    });

    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
      duration: 5000,
      icon: "🙏",
      style: {
        background: "green",
        color: "white",
      },
    });
  });

  it("should show error if axios fails", async () => {
    const expectedFailureMessage = "axios failed";
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: expectedFailureMessage },
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = getByPlaceholderText("Enter Your Email");
    const passwordInput = getByPlaceholderText("Enter Your Password");

    fireEvent.change(emailInput, {
      target: { value: defaultLoginDetails.email },
    });
    fireEvent.change(passwordInput, {
      target: { value: defaultLoginDetails.password },
    });

    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(expectedFailureMessage);
  });

  it("should display error message on failed login", async () => {
    axios.post.mockRejectedValueOnce({ message: "Invalid credentials" });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = getByPlaceholderText("Enter Your Email");
    const passwordInput = getByPlaceholderText("Enter Your Password");

    fireEvent.change(emailInput, {
      target: { value: defaultLoginDetails.email },
    });
    fireEvent.change(passwordInput, {
      target: { value: defaultLoginDetails.password },
    });

    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("should not login user with empty email", async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    const emailInput = getByPlaceholderText("Enter Your Email");
    const passwordInput = getByPlaceholderText("Enter Your Password");

    fireEvent.change(passwordInput, {
      target: { value: defaultLoginDetails.password },
    });

    expect(emailInput.value).toBe("");
    expect(passwordInput.value).toBe(defaultLoginDetails.password);

    fireEvent.click(getByText("LOGIN"));

    expect(axios.post).not.toHaveBeenCalled();
    expect(emailInput.validity.valueMissing).toBe(true);
    expect(emailInput.validationMessage).toBe("Constraints not satisfied");
  });

  it("should not login user with empty password", async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    const emailInput = getByPlaceholderText("Enter Your Email");
    const passwordInput = getByPlaceholderText("Enter Your Password");

    fireEvent.change(emailInput, {
      target: { value: defaultLoginDetails.email },
    });

    expect(emailInput.value).toBe(defaultLoginDetails.email);
    expect(passwordInput.value).toBe("");

    fireEvent.click(getByText("LOGIN"));

    expect(axios.post).not.toHaveBeenCalled();
    expect(passwordInput.validity.valueMissing).toBe(true);
    expect(passwordInput.validationMessage).toBe("Constraints not satisfied");
  });
});
