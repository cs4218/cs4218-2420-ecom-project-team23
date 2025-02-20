import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Policy from "./Policy";

jest.mock("./../components/Header", () => () => <div>Header</div>);

describe("Contact Component", () => {
  const renderPage = () => {
    return render(
      <MemoryRouter>
        <Policy />
      </MemoryRouter>
    );
  };

  it("should render the correct texts on the Policy Page", () => {
    renderPage();

    expect(screen.getByText("PRIVACY POLICY")).toBeInTheDocument();
    expect(
      screen.getByText(
        "1. Our website uses cookies to improve user experience. You can disable cookies through your browser settings."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "2. We do not store credit card details nor do we share customer details with any 3rd parties."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "3.We may update this privacy policy from time to time. Any changes will be posted on this page."
      )
    ).toBeInTheDocument();
  });

  it("should render the correct image on the Contact Page", () => {
    renderPage();

    const img = screen.getByRole("img", { name: "policy" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/policy.jpeg");
  });
});
