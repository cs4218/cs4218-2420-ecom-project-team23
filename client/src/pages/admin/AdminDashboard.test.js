/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/auth";

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

describe("AdminDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the admin dashboard with correct details", async () => {
    const mockAuth = {
      user: {
        name: "Admin John",
        email: "admin@example.com",
        phone: "123-456-7890",
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("layout")).toBeInTheDocument();
    expect(await screen.findByTestId("admin-menu")).toBeInTheDocument();
    expect(
      await screen.findByText("Admin Name : Admin John")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Admin Email : admin@example.com")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Admin Contact : 123-456-7890")
    ).toBeInTheDocument();
  });

  it("handles missing user data gracefully", async () => {
    useAuth.mockReturnValue([null]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("layout")).toBeInTheDocument();
    expect(await screen.findByTestId("admin-menu")).toBeInTheDocument();
    expect(await screen.findByText(/Admin Name/i)).toHaveTextContent(
      "Admin Name :"
    );
    expect(await screen.findByText(/Admin Email/i)).toHaveTextContent(
      "Admin Email :"
    );
    expect(await screen.findByText(/Admin Contact/i)).toHaveTextContent(
      "Admin Contact :"
    );
  });
});
