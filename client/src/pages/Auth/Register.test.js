import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
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

  const fillForm = (user) => {
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: user.name },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: user.email },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: user.password },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: user.phone },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: user.address },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your DOB"), {
      target: { value: user.dob },
    });
    fireEvent.change(
      screen.getByPlaceholderText("What is Your Favorite sports"),
      {
        target: { value: user.answer },
      }
    );
  };

  const renderPage = () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    const passwordInput = screen.getByPlaceholderText("Enter Your Password");
    const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
    const addressInput = screen.getByPlaceholderText("Enter Your Address");
    const dobInput = screen.getByPlaceholderText("Enter Your DOB");
    const answerInput = screen.getByPlaceholderText(
      "What is Your Favorite sports"
    );

    return {
      nameInput,
      emailInput,
      passwordInput,
      phoneInput,
      addressInput,
      dobInput,
      answerInput,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders register form", () => {
    const {
      getByText,
      nameInput,
      emailInput,
      passwordInput,
      phoneInput,
      addressInput,
      dobInput,
      answerInput,
    } = renderPage();

    expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(phoneInput).toBeInTheDocument();
    expect(addressInput).toBeInTheDocument();
    expect(dobInput).toBeInTheDocument();
    expect(answerInput).toBeInTheDocument();
  });

  it("inputs should be initially empty", () => {
    const {
      nameInput,
      emailInput,
      passwordInput,
      phoneInput,
      addressInput,
      dobInput,
      answerInput,
    } = renderPage();

    expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
    expect(nameInput.value).toBe("");
    expect(emailInput.value).toBe("");
    expect(passwordInput.value).toBe("");
    expect(phoneInput.value).toBe("");
    expect(addressInput.value).toBe("");
    expect(dobInput.value).toBe("");
    expect(answerInput.value).toBe("");
  });

  it("should allow typing in the input fields", () => {
    const {
      nameInput,
      emailInput,
      passwordInput,
      phoneInput,
      addressInput,
      dobInput,
      answerInput,
    } = renderPage();

    fillForm(defaultRegisterUser);

    expect(nameInput.value).toBe(defaultRegisterUser.name);
    expect(emailInput.value).toBe(defaultRegisterUser.email);
    expect(passwordInput.value).toBe(defaultRegisterUser.password);
    expect(phoneInput.value).toBe(defaultRegisterUser.phone);
    expect(addressInput.value).toBe(defaultRegisterUser.address);
    expect(dobInput.value).toBe(defaultRegisterUser.dob);
    expect(answerInput.value).toBe(defaultRegisterUser.answer);
  });

  describe("Given valid registration details", () => {
    it("should register the user successfully", async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      renderPage();

      fillForm(defaultRegisterUser);

      fireEvent.click(screen.getByText("REGISTER"));

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

      renderPage();

      fillForm(defaultRegisterUser);
      fireEvent.click(screen.getByText("REGISTER"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith(expectedFailureMessage);
    });

    it("should display error message on failed registration", async () => {
      axios.post.mockRejectedValueOnce({ message: "User already exists" });

      renderPage();

      fillForm(defaultRegisterUser);
      fireEvent.click(screen.getByText("REGISTER"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  describe("Given invalid registration details", () => {
    it("should prevent form submission if name is missing", async () => {
      const { nameInput } = renderPage();

      fillForm({ ...defaultRegisterUser, name: "" });

      fireEvent.click(screen.getByText("REGISTER"));

      expect(nameInput.validity.valueMissing).toBe(true);
      expect(nameInput.validationMessage).toBe("Constraints not satisfied");
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should prevent form submission if email is missing", async () => {
      const { emailInput } = renderPage();

      fillForm({ ...defaultRegisterUser, email: "" });

      fireEvent.click(screen.getByText("REGISTER"));

      expect(emailInput.validity.valueMissing).toBe(true);
      expect(emailInput.validationMessage).toBe("Constraints not satisfied");
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should prevent form submission if password is missing", async () => {
      const { passwordInput } = renderPage();

      fillForm({ ...defaultRegisterUser, password: "" });

      fireEvent.click(screen.getByText("REGISTER"));

      expect(passwordInput.validity.valueMissing).toBe(true);
      expect(passwordInput.validationMessage).toBe("Constraints not satisfied");
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should prevent form submission if phone is missing", async () => {
      const { phoneInput } = renderPage();

      fillForm({ ...defaultRegisterUser, phone: "" });

      fireEvent.click(screen.getByText("REGISTER"));

      expect(phoneInput.validity.valueMissing).toBe(true);
      expect(phoneInput.validationMessage).toBe("Constraints not satisfied");
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should prevent form submission if address is missing", async () => {
      const { addressInput } = renderPage();

      fillForm({ ...defaultRegisterUser, address: "" });

      fireEvent.click(screen.getByText("REGISTER"));

      expect(addressInput.validity.valueMissing).toBe(true);
      expect(addressInput.validationMessage).toBe("Constraints not satisfied");
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should prevent form submission if dob is missing", async () => {
      const { dobInput } = renderPage();

      fillForm({ ...defaultRegisterUser, dob: "" });

      fireEvent.click(screen.getByText("REGISTER"));

      expect(dobInput.validity.valueMissing).toBe(true);
      expect(dobInput.validationMessage).toBe("Constraints not satisfied");
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should prevent form submission if answer is missing", async () => {
      const { answerInput } = renderPage();

      fillForm({ ...defaultRegisterUser, answer: "" });

      fireEvent.click(screen.getByText("REGISTER"));

      expect(answerInput.validity.valueMissing).toBe(true);
      expect(answerInput.validationMessage).toBe("Constraints not satisfied");
      expect(axios.post).not.toHaveBeenCalled();
    });
  });
});
