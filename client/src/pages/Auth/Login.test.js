import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "./Login";
import { de } from "date-fns/locale";

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
  const defaultLoginUser = {
    email: "test@example.com",
    password: "password123",
  };

  const fillForm = (getByPlaceholderText, user) => {
    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: user.email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), {
      target: { value: user.password },
    });
  };

  const renderPage = () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = getByPlaceholderText("Enter Your Email");
    const passwordInput = getByPlaceholderText("Enter Your Password");

    return { getByText, getByPlaceholderText, emailInput, passwordInput };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form", () => {
    const { getByText, emailInput, passwordInput } = renderPage();

    expect(getByText("LOGIN FORM")).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it("inputs should be initially empty", () => {
    const { getByText, emailInput, passwordInput } = renderPage();

    expect(getByText("LOGIN FORM")).toBeInTheDocument();
    expect(emailInput.value).toBe("");
    expect(passwordInput.value).toBe("");
  });

  it("should allow typing into input fields", () => {
    const { emailInput, passwordInput, getByPlaceholderText } = renderPage();

    fillForm(getByPlaceholderText, defaultLoginUser);

    expect(emailInput.value).toBe(defaultLoginUser.email);
    expect(passwordInput.value).toBe(defaultLoginUser.password);
  });

  describe("Given valid login details", () => {
    it("should login the user successfully", async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          user: { id: 1, name: "John Doe", email: "test@example.com" },
          token: "mockToken",
        },
      });

      const { getByText, getByPlaceholderText } = renderPage();

      fillForm(getByPlaceholderText, defaultLoginUser);

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

      const { getByText, getByPlaceholderText } = renderPage();

      fillForm(getByPlaceholderText, defaultLoginUser);

      fireEvent.click(getByText("LOGIN"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith(expectedFailureMessage);
    });

    it("should display error message on failed login", async () => {
      axios.post.mockRejectedValueOnce({ message: "Invalid credentials" });

      const { getByText, getByPlaceholderText } = renderPage();

      fillForm(getByPlaceholderText, defaultLoginUser);

      fireEvent.click(getByText("LOGIN"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  describe("Given invalid login details", () => {
    it("should not login user with empty email", async () => {
      const { getByText, getByPlaceholderText, emailInput, passwordInput } =
        renderPage();

      fillForm(getByPlaceholderText, { ...defaultLoginUser, email: "" });

      expect(emailInput.value).toBe("");
      expect(passwordInput.value).toBe(defaultLoginUser.password);

      fireEvent.click(getByText("LOGIN"));

      expect(axios.post).not.toHaveBeenCalled();
      expect(emailInput.validity.valueMissing).toBe(true);
      expect(emailInput.validationMessage).toBe("Constraints not satisfied");
    });

    it("should not login user with empty password", async () => {
      const { getByText, getByPlaceholderText, emailInput, passwordInput } =
        renderPage();

      fillForm(getByPlaceholderText, { ...defaultLoginUser, password: "" });

      expect(emailInput.value).toBe(defaultLoginUser.email);
      expect(passwordInput.value).toBe("");

      fireEvent.click(getByText("LOGIN"));

      expect(axios.post).not.toHaveBeenCalled();
      expect(passwordInput.validity.valueMissing).toBe(true);
      expect(passwordInput.validationMessage).toBe("Constraints not satisfied");
    });
  });
});
