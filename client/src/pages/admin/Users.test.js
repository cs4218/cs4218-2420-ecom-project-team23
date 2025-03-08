/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";
import Users from "../../pages/admin/Users";

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

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

    // Use findByTestId which is already async and waits for the element to appear
    expect(await screen.findByTestId("layout")).toBeInTheDocument();
    expect(await screen.findByTestId("admin-menu")).toBeInTheDocument();

    expect(screen.getByText("All Users")).toBeInTheDocument();
  });
});
