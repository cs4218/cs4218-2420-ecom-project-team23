import "@testing-library/jest-dom/extend-expect";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useCart } from "../context/cart";
import HomePage from "./HomePage";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockCart = jest.fn();
jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], mockCart]),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="mock-layout" title={title}>
    {children}
  </div>
));

describe("HomePage Component", () => {
  let mockConsoleLog;

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
          name: "Cat 1",
          slug: "cat1",
        },
        {
          _id: "2",
          name: "Cat 2",
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

  const defaultAxiosReturn = [
    Promise.resolve(mockCats),
    Promise.resolve(mockProductPage1),
    Promise.resolve(mockProductPage2),
    Promise.resolve({ data: { total: 4 } }),
  ];

  const axiosHelper = (url, data = defaultAxiosReturn) => {
    if (url == "/api/v1/category/get-category") {
      return data[0];
    } else if (url == "/api/v1/product/product-list/1") {
      return data[1];
    } else if (url == "/api/v1/product/product-list/2") {
      return data[2];
    } else if (url == "/api/v1/product/product-count") {
      return data[3];
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

    axios.get.mockImplementation((url) => axiosHelper(url));

    axios.post.mockImplementation((url) => {
      if (url == "/api/v1/product/product-filters") {
        return Promise.resolve(mockProductPage1);
      }
    });
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  test("apis are called correctly", async () => {
    renderComponent();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
    });
  });

  test("renders all default texts and components correctly on successful api calls", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
      expect(screen.getByTestId("mock-layout")).toHaveAttribute(
        "title",
        "ALL Products - Best offers "
      );

      // loads default banner image
      expect(screen.getByAltText("banner image")).toHaveAttribute(
        "src",
        "/images/Virtual.png"
      );

      // loads all default texts
      expect(screen.getByText("All Products")).toBeInTheDocument();

      expect(screen.getByText("Filter By Category")).toBeInTheDocument();
      expect(screen.getByText("Cat 1")).toBeInTheDocument();
      expect(screen.getByText("Cat 2")).toBeInTheDocument();

      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
      expect(screen.getByText("$0 to 19")).toBeInTheDocument();
      expect(screen.getByText("$20 to 39")).toBeInTheDocument();
      expect(screen.getByText("$40 to 59")).toBeInTheDocument();
      expect(screen.getByText("$60 to 79")).toBeInTheDocument();
      expect(screen.getByText("$80 to 99")).toBeInTheDocument();
      expect(screen.getByText("$100 or more")).toBeInTheDocument();

      expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /load more/i })
      ).toBeInTheDocument();
    });
  });

  test("loads first page's product correctly", async () => {
    const localStorageSetCart = jest.spyOn(Storage.prototype, "setItem");
    useCart.mockImplementation(() => [[], mockCart]);

    renderComponent();

    await waitFor(() => {
      mockProductPage1.data.products.forEach((p) => {
        const toLocaleString = p.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });

        const productRoot = screen.getByText(p.name).closest(".card");
        const moreDetailsButton = within(productRoot).getByRole("button", {
          name: /more details/i,
        });

        const addToCardButton = within(productRoot).getByRole("button", {
          name: /add to cart/i,
        });

        fireEvent.click(moreDetailsButton);
        fireEvent.click(addToCardButton);

        expect(screen.getByAltText(p.name)).toBeInTheDocument();
        expect(screen.getByAltText(p.name)).toHaveAttribute(
          "src",
          `/api/v1/product/product-photo/${p._id}`
        );

        expect(screen.getByText(p.name)).toBeInTheDocument();

        expect(screen.getByText(toLocaleString)).toBeInTheDocument();
        expect(
          screen.getByText(`${p.description.substring(0, 60)}...`)
        ).toBeInTheDocument();

        expect(moreDetailsButton).toBeInTheDocument();

        expect(mockNavigate).toHaveBeenCalledWith(`/product/${p.slug}`);

        expect(mockCart).toHaveBeenCalledWith(expect.arrayContaining([p]));

        expect(localStorageSetCart).toHaveBeenCalledWith(
          "cart",
          expect.stringContaining(JSON.stringify([p]))
        );

        expect(toast.success).toHaveBeenCalledWith("Item added to cart");

        expect(screen.queryByText("Load More")).toBeInTheDocument();
      });
    });
  });

  test("loads second page correctly", async () => {
    renderComponent();
    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /load more/i }));

      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
    });
  });

  test("loads second page's product correctly", async () => {
    const localStorageSetCart = jest.spyOn(Storage.prototype, "setItem");
    useCart.mockImplementation(() => [[], mockCart]);

    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    });

    await waitFor(() => {
      mockProductPage2.data.products.forEach((p) => {
        const toLocaleString = p.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });

        const productRoot = screen.getByText(p.name).closest(".card");
        const moreDetailsButton = within(productRoot).getByRole("button", {
          name: /more details/i,
        });

        const addToCardButton = within(productRoot).getByRole("button", {
          name: /add to cart/i,
        });

        fireEvent.click(moreDetailsButton);
        fireEvent.click(addToCardButton);

        expect(screen.getByAltText(p.name)).toBeInTheDocument();
        expect(screen.getByAltText(p.name)).toHaveAttribute(
          "src",
          `/api/v1/product/product-photo/${p._id}`
        );

        expect(screen.getByText(p.name)).toBeInTheDocument();

        expect(screen.getByText(toLocaleString)).toBeInTheDocument();
        expect(
          screen.getByText(`${p.description.substring(0, 60)}...`)
        ).toBeInTheDocument();

        expect(moreDetailsButton).toBeInTheDocument();

        expect(mockNavigate).toHaveBeenCalledWith(`/product/${p.slug}`);

        expect(mockCart).toHaveBeenCalledWith(expect.arrayContaining([p]));

        expect(localStorageSetCart).toHaveBeenCalledWith(
          "cart",
          expect.stringContaining(JSON.stringify([p]))
        );

        expect(toast.success).toHaveBeenCalledWith("Item added to cart");

        expect(screen.queryByText("Load More")).toBeNull();
      });
    });
  });

  test("calls reload window", async () => {
    // https://gist.github.com/remarkablemark/5cb571a13a6635ab89cf2bb47dc004a3
    const { location } = window;
    delete window.location;
    window.location = { reload: jest.fn() };

    renderComponent();
    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

      expect(window.location.reload).toHaveBeenCalled();
    });

    window.location = location;
  });

  test("renders no products if api returns nothing", async () => {
    const emptyAxiosReturn = [
      Promise.resolve({
        data: {
          success: true,
          category: [],
        },
      }),
      Promise.resolve({
        data: {
          products: [],
        },
      }),
      Promise.resolve({
        data: {
          products: [],
        },
      }),
      Promise.resolve({ data: { total: 0 } }),
    ];

    axios.get.mockImplementation((url) => axiosHelper(url, emptyAxiosReturn));
    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(container.querySelectorAll(".card").length).toBe(0);
      expect(screen.queryByText("Load More")).not.toBeInTheDocument();
    });
  });

  test("able to filter products by category", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: /cat 1/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox", { name: /cat 1/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        {
          checked: ["1"],
          radio: [],
        }
      );
    });
  });

  test("able to unfilter products", async () => {
    axios.get.mockImplementation((url) => axiosHelper(url));

    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByRole("checkbox", { name: /cat 1/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /cat 1/i }));

      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
  });

  test("able to filter products by price", async () => {
    renderComponent();

    const radio = await screen.findByRole("radio", { name: /^\$0 to 19$/i });

    await waitFor(() => {
      expect(radio).toBeInTheDocument();
    });

    fireEvent.click(radio);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        { checked: [], radio: [0, 19] }
      );
    });
  });

  test("able to filter by both price and cats", async () => {
    renderComponent();

    const radio = await screen.findByRole("radio", { name: /^\$0 to 19$/i });

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: /cat 1/i })
      ).toBeInTheDocument();
      expect(radio).toBeInTheDocument();
    });

    fireEvent.click(radio);
    fireEvent.click(screen.getByRole("checkbox", { name: /cat 1/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        {
          checked: ["1"],
          radio: [0, 19],
        }
      );
    });
  });

  // Error tests
  test("apis throws error to console", async () => {
    const errorAxiosReturn = [
      Promise.reject(new Error("Failed to get categories")),
      Promise.reject(new Error("Failed to get products page 1")),
      Promise.resolve([]),
      Promise.reject(new Error("Failed to get product count")),
    ];

    axios.get.mockImplementation((url) => axiosHelper(url, errorAxiosReturn));

    renderComponent();

    await waitFor(() => {
      expect(mockConsoleLog).toHaveBeenCalledWith(
        new Error("Failed to get categories")
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        new Error("Failed to get products page 1")
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        new Error("Failed to get product count")
      );
    });
  });

  test("fails to load page 2", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/product-list/2") {
        return Promise.reject(new Error("Failed to load page 2"));
      }
      return axiosHelper(url);
    });

    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByText("Load More"));
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
    });

    expect(mockConsoleLog).toHaveBeenCalledWith(
      new Error("Failed to load page 2")
    );
  });

  test("api errors renders no checkboxes and no load more button", async () => {
    const errorAxiosReturn = [
      Promise.reject(new Error("Failed1")),
      Promise.reject(new Error("Failed2")),
      Promise.resolve([]),
      Promise.reject(new Error("Failed3")),
    ];

    axios.get.mockImplementation((url) => axiosHelper(url, errorAxiosReturn));

    renderComponent();

    await waitFor(() => {
      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
      expect(screen.queryByText("Load More")).not.toBeInTheDocument();
      expect(screen.queryByText("ADD TO CART")).not.toBeInTheDocument();
    });
  });

  test("renders no category if success is false when getting all category", async () => {
    const customMockCats = {
      data: {
        success: false,
        category: [
          {
            _id: "1",
            name: "Cat 1",
            slug: "cat1",
          },
          {
            _id: "2",
            name: "Cat 2",
            slug: "cat2",
          },
        ],
      },
    };

    const falseAxiosReturn = [
      Promise.resolve(customMockCats),
      Promise.resolve(mockProductPage1),
      Promise.resolve(mockProductPage2),
      Promise.resolve({ data: { total: 4 } }),
    ];

    axios.get.mockImplementation((url) => axiosHelper(url, falseAxiosReturn));

    renderComponent();

    await waitFor(() => {
      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
      expect(
        screen.queryByRole("checkbox", { name: /cat 1/i })
      ).not.toBeInTheDocument();
    });
  });

  test("fails to filter product via checkbox", async () => {
    axios.post.mockRejectedValue(new Error("Failed to filter"));

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: /cat 1/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox", { name: /cat 1/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        { checked: ["1"], radio: [] }
      );
    });

    await waitFor(() => {
      expect(mockConsoleLog).toHaveBeenCalledWith(
        new Error("Failed to filter")
      );
    });
  });

  test("fails to filter product via radio box", async () => {
    axios.post.mockRejectedValue(new Error("Failed to filter"));

    renderComponent();

    const radio = await screen.findByRole("radio", { name: /^\$0 to 19$/i });
    fireEvent.click(radio);

    // Verify radio selection
    expect(radio).toBeChecked();

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        { checked: [], radio: [0, 19] }
      );
    });

    await waitFor(() => {
      expect(mockConsoleLog).toHaveBeenCalledWith(
        new Error("Failed to filter")
      );
    });
  });
});
