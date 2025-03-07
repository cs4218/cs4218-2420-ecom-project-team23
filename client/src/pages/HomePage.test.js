import "@testing-library/jest-dom/extend-expect";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import HomePage from "./HomePage";
import axios from "axios";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => jest.fn()),
}));

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="mock-layout" title={title}>
    {children}
  </div>
));

describe("HomePage Component", () => {
  const mockProductPage1 = {
    data: {
      products: [
        {
          _id: "1",
          name: "Product 1",
          slug: "product-1",
          description:
            "Product 1 is so awesome, buy this right now, buy buy buy! Pls buy bro, I need money",
          price: 69.69,
        },
        {
          _id: "2",
          name: "Product 2",
          slug: "Product-2",
          description: "Don't buy this, this sucks",
          price: 420.42,
        },
      ],
    },
  };

  const mockProductPage2 = {
    data: {
      products: [
        {
          _id: "3",
          name: "Product 3",
          slug: "product-3",
          description:
            "Product 3 is so awesome, buy this right now, buy buy buy! Pls buy bro, I need money",
          price: 1234,
        },
        {
          _id: "4",
          name: "Product 4",
          slug: "product-4",
          description: "Buy this, this is good",
          price: 100000,
        },
      ],
    },
  };

  const mockCats = {
    data: {
      success: true,
      category: [
        {
          _id: "1",
          name: "Cat1",
          slug: "cat1",
        },
        {
          _id: "2",
          name: "Cat2",
          slug: "cat2",
        },
      ],
    },
  };

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/"]}>
        <HomePage />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url == "/api/v1/category/get-category") {
        return Promise.resolve(mockCats);
      } else if (url == "/api/v1/product/product-list/1") {
        return Promise.resolve(mockProductPage1);
      } else if (url == "/api/v1/product/product-list/2") {
        return Promise.resolve(mockProductPage2);
      } else if (url == "/api/v1/product/product-count") {
        return Promise.resolve({
          data: {
            total: 4,
          },
        });
      }
    });

    axios.post.mockImplementation((url) => {
      if (url == "/api/v1/product/product-filters") {
        return Promise.resolve(mockProductPage1);
      }
    });
  });

  test("renders HomePage component", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    });
  });

  test("renders banner image", async () => {
    renderComponent();

    const bannerImage = screen.getByAltText("banner image");

    await waitFor(() => {
      expect(bannerImage).toHaveAttribute("src", "/images/Virtual.png");
    });
  });

  test("all default texts are rendered", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Filter By Category")).toBeInTheDocument();
      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
      expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();
    });
  });
});
