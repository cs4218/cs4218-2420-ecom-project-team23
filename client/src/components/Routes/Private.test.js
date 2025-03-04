import "@testing-library/jest-dom/extend-expect";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "../../context/auth";
import PrivateRoute from "./Private";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../Spinner", () => () => <div data-testid="spinner">Spinner</div>);

describe("Private Route", () => {
  const OutletComponent = () => <div data-testid="outlet">Outlet</div>;

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route index element={<OutletComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // testing for spinner when authenticating
  test("renders Spinner when checking authentication", () => {
    useAuth.mockReturnValue([{ token: "check-auth" }]);

    axios.get.mockImplementation(() => new Promise((_) => {}));
    renderComponent();

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  // testing for spinner when no token
  test("renders Spinner when no token", () => {
    useAuth.mockReturnValue([{ token: null }]);
    renderComponent();

    expect(axios.get).not.toHaveBeenCalled(); 
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  // testing for outlet when authenticated
  test("renders component when authenticated", async () => {
    useAuth.mockReturnValue([{ token: "correct-token" }]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderComponent();

    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });
  });

  // testing for re-render when token updates
  test("re-runs auth check when token changes", async () => {
    useAuth.mockReturnValue([{ token: null }]);
    const { rerender } = renderComponent();

    expect(axios.get).not.toHaveBeenCalled();

    useAuth.mockReturnValue([{ token: "test-token" }]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    // use new useAuth
    rerender(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route index element={<OutletComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");

    await waitFor(() => {
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });
  });
});
