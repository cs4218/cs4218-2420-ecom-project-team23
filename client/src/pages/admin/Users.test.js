/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";
import Users from "../../pages/admin/Users";

// Mock AdminMenu and Layout components
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

describe("Users Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Users page correctly", async () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    // Ensure Layout and AdminMenu are rendered
    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });

    // Ensure "All Users" heading is displayed
    expect(screen.getByText("All Users")).toBeInTheDocument();
  });
});
