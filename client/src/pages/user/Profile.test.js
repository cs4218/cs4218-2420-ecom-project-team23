import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/auth";
import { useCart } from "../../context/cart";
import { useSearch } from "../../context/search";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../context/auth");
jest.mock("../../context/cart");
jest.mock("../../context/search");
jest.mock("../../hooks/useCategory");

describe("Profile Component", () => {
  let mockSetAuth;

  const defaultUser = {
    name: "John Doe",
    email: "example@gmail.com",
    phone: "91234567",
    password: "password",
    address: "Example Street",
  };

  const mockUpdatedUser = {
    name: "Jane Doe",
    email: "example@gmail.com",
    phone: "98765432",
    password: "password2",
    address: "Example Street 2",
  };

  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );
  };

  const fillForm = (user, newPassword) => {
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: user.name },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Enter Your Current Password"),
      {
        target: { value: user.password },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Enter Your New Password"), {
      target: { value: newPassword },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: user.phone },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: user.address },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetAuth = jest.fn();
    useAuth.mockReturnValue([{ user: defaultUser }, mockSetAuth]);
    useCart.mockReturnValue([null, jest.fn()]);
    useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);
    localStorage.setItem("auth", JSON.stringify({ user: defaultUser }));
  });

  it("should render user profile form with default data", () => {
    renderPage();

    expect(screen.getByText("USER PROFILE")).toBeInTheDocument();
    expect(screen.getByText("UPDATE")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue(
      defaultUser.name
    );
    expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue(
      defaultUser.email
    );
    expect(screen.getByPlaceholderText("Enter Your Email")).toBeDisabled();
    expect(
      screen.getByPlaceholderText("Enter Your Current Password")
    ).toHaveValue("");
    expect(
      screen.getByPlaceholderText("Enter Your Current Password")
    ).toBeRequired();
    expect(screen.getByPlaceholderText("Enter Your New Password")).toHaveValue(
      ""
    );
    expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
      defaultUser.phone
    );
    expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(
      defaultUser.address
    );
  });

  it("should update user profile successfully when form is submitted with valid non-empty inputs", async () => {
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    axios.put.mockResolvedValue({
      data: {
        updatedUser: mockUpdatedUser,
      },
    });

    renderPage();

    fillForm(
      { ...mockUpdatedUser, password: defaultUser.password },
      mockUpdatedUser.password
    );

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        ...mockUpdatedUser,
        password: defaultUser.password,
        newPassword: mockUpdatedUser.password,
      });
    });

    expect(mockSetAuth).toHaveBeenCalledWith({ user: mockUpdatedUser });
    expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");

    const ls = JSON.parse(localStorage.getItem("auth"));
    expect(ls.user).toEqual(mockUpdatedUser);
    expect(setItemSpy).toHaveBeenCalledWith("auth", JSON.stringify(ls));
  });

  it("should update user profile successfully when form is submitted with empty fields except current password", async () => {
    axios.put.mockResolvedValue({
      data: {
        updatedUser: defaultUser,
      },
    });

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    const emptyUser = {
      name: "",
      email: defaultUser.email,
      phone: "",
      password: defaultUser.password,
      address: "",
    };

    renderPage();

    fillForm(emptyUser, "");

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        ...emptyUser,
        newPassword: "",
      });
    });

    expect(mockSetAuth).toHaveBeenCalledWith({ user: defaultUser });
    expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");

    const ls = JSON.parse(localStorage.getItem("auth"));
    expect(ls.user).toEqual(defaultUser);
    expect(setItemSpy).toHaveBeenCalledWith("auth", JSON.stringify(ls));
  });

  it("should prevent form submission if only current password is missing", async () => {
    renderPage();

    const passwordInput = screen.getByPlaceholderText(
      "Enter Your Current Password"
    );

    fillForm({ ...defaultUser, password: "" });

    fireEvent.click(screen.getByText("UPDATE"));

    expect(passwordInput.validity.valueMissing).toBe(true);
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("should show toast error if invalid current password", async () => {
    const wrongPassword = "wrong password";
    axios.put.mockResolvedValue({
      data: {
        error: "Unauthorized to update. Invalid Password",
      },
    });

    renderPage();

    fillForm({ defaultUser, password: wrongPassword }, "");

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        ...defaultUser,
        password: wrongPassword,
        newPassword: "",
      });
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Unauthorized to update. Invalid Password"
    );
  });

  it("should show toast error if invalid new password", async () => {
    const newPassword = "new";
    axios.put.mockResolvedValue({
      data: {
        error: "Password should be at least 6 character long",
      },
    });

    renderPage();

    fillForm(defaultUser, newPassword);

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        ...defaultUser,
        newPassword: newPassword,
      });
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Password should be at least 6 character long"
    );
  });
});
