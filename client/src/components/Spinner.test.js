import "@testing-library/jest-dom/extend-expect";
import { act, render, screen } from "@testing-library/react";
import Spinner from "./Spinner";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(() => mockNavigate),
  useLocation: jest.fn(() => ({ pathname: "/test-path" })),
}));

describe("Spinner Component", () => {
  const renderComponent = (customPath) => {
    return render(<Spinner path={customPath} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders spinner component", () => {
    renderComponent();

    expect(
      screen.getByText(/redirecting to you in 3 second\(s\)/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("decrements timer to 2 seconds", () => {
    renderComponent();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(
      screen.getByText(/redirecting to you in 2 second\(s\)/i)
    ).toBeInTheDocument();
  });

  test("decrements timer to 1 second", () => {
    renderComponent();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(
      screen.getByText(/redirecting to you in 1 second\(s\)/i)
    ).toBeInTheDocument();
  });

  test("navigates to default path when timer reaches 0", () => {
    renderComponent();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      state: "/test-path",
    });
  });

  test("navigates to custom path when timer reaches 0", () => {
    renderComponent("custom-path");

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/custom-path", {
      state: "/test-path",
    });
  });
});
