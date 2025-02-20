import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

jest.mock("./../components/Header", () => () => <div>Header</div>);

describe("Contact Component", () => {
  const renderPage = () => {
    return render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
  };

  it("should render the correct texts on the Contact Page", () => {
    renderPage();

    expect(screen.getByText("CONTACT US")).toBeInTheDocument();
    expect(
      screen.getByText(
        "For any query or info about product, feel free to call anytime. We are available 24X7."
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/www.help@ecommerceapp.com/)).toBeInTheDocument();
    expect(screen.getByText(/012-3456789/)).toBeInTheDocument();
    expect(screen.getByText(/1800-0000-0000/)).toBeInTheDocument();
  });

  it("should render the correct image on the Contact Page", () => {
    renderPage();

    const img = screen.getByRole("img", { name: "contactus" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
  });
});
