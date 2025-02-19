import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";
import Login from "./Login";

// Mocking axios.post
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn().mockReturnValue(jest.fn()),
}));

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

  const fillForm = (user) => {
    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: user.email },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: user.password },
    });
  };

  const renderPage = () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    const passwordInput = screen.getByPlaceholderText("Enter Your Password");

    return { emailInput, passwordInput };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form", () => {
    const { emailInput, passwordInput } = renderPage();

    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it("inputs should be initially empty", () => {
    const { emailInput, passwordInput } = renderPage();

    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    expect(emailInput.value).toBe("");
    expect(passwordInput.value).toBe("");
  });

  it("should allow typing into input fields", () => {
    const { emailInput, passwordInput } = renderPage();

    fillForm(defaultLoginUser);

    expect(emailInput.value).toBe(defaultLoginUser.email);
    expect(passwordInput.value).toBe(defaultLoginUser.password);
  });

  it("should redirect to forgot password page when clicked", () => {
    const { getByText } = renderPage();

    fireEvent.click(getByText("Forgot Password"));

    expect(useNavigate()).toHaveBeenCalledWith("/forgot-password");
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

      renderPage();

      fillForm(defaultLoginUser);

      fireEvent.click(screen.getByText("LOGIN"));

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

      renderPage();

      fillForm(defaultLoginUser);

      fireEvent.click(screen.getByText("LOGIN"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith(expectedFailureMessage);
    });

    it("should display error message on failed login", async () => {
      axios.post.mockRejectedValueOnce({ message: "Invalid credentials" });

      renderPage();

      fillForm(defaultLoginUser);

      fireEvent.click(screen.getByText("LOGIN"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  describe("Given invalid login details", () => {
    it("should not login user with empty email", async () => {
      const { emailInput, passwordInput } = renderPage();

      fillForm({ ...defaultLoginUser, email: "" });

      expect(emailInput.value).toBe("");
      expect(passwordInput.value).toBe(defaultLoginUser.password);

      fireEvent.click(screen.getByText("LOGIN"));

      expect(axios.post).not.toHaveBeenCalled();
      expect(emailInput.validity.valueMissing).toBe(true);
      expect(emailInput.validationMessage).toBe("Constraints not satisfied");
    });

    it("should not login user with empty password", async () => {
      const { emailInput, passwordInput } = renderPage();

      fillForm({ ...defaultLoginUser, password: "" });

      expect(emailInput.value).toBe(defaultLoginUser.email);
      expect(passwordInput.value).toBe("");

      fireEvent.click(screen.getByText("LOGIN"));

      expect(axios.post).not.toHaveBeenCalled();
      expect(passwordInput.validity.valueMissing).toBe(true);
      expect(passwordInput.validationMessage).toBe("Constraints not satisfied");
    });
  });
});
