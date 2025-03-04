import "@testing-library/jest-dom/extend-expect";
import { describe } from "node:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UserMenu from "./UserMenu";

describe("UserMenu", () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<UserMenu />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test("renders UserMenu component", () => {
    renderComponent();

    expect(
      screen.getByRole("heading", { name: /dashboard/i })
    ).toBeInTheDocument();
  });

  test("renders nav links", () => {
    renderComponent();

    expect(
      screen.getByRole("link", { name: /profile/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /orders/i })).toBeInTheDocument();
  });

  test("link to profile page is correct", () => {
    renderComponent();

    const profileLink = screen.getByRole("link", { name: /profile/i });

    expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
  });
  
  test("link to profile have the correct classes", () => {
    renderComponent();

    const profileLink = screen.getByRole("link", { name: /profile/i });

    expect(profileLink).toHaveClass("list-group-item");
    expect(profileLink).toHaveClass("list-group-item-action");
  });

  test("link to orders page is correct", () => {
    renderComponent();

    const ordersLink = screen.getByRole("link", { name: /orders/i });

    expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
  });

  test("link to orders have the correct classes", () => {
    renderComponent();

    const ordersLink = screen.getByRole("link", { name: /orders/i });

    expect(ordersLink).toHaveClass("list-group-item");
    expect(ordersLink).toHaveClass("list-group-item-action");
  });
});
