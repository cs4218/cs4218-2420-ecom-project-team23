import React from "react";
import axios from "axios";
import { AuthProvider, useAuth } from "../context/auth";
import { screen, render } from "@testing-library/react";

jest.mock("axios");

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
  },
});

describe("Auth API", () => {
  let mockAuthData;

  const TestChild = () => {
    const [auth] = useAuth();
    return (
      <div>
        <p>User:{auth.user}</p>
        <p>Token:{auth.token}</p>
      </div>
    );
  };

  const renderPage = () => {
    return render(
      <AuthProvider>
        <TestChild />
      </AuthProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthData = {
      user: "Example User",
      token: "Example Token",
    };
  });

  it("auth should initially be empty", async () => {
    renderPage();

    expect(axios.defaults.headers.common["Authorization"]).toBe("");

    expect(screen.getByText("User:")).toBeTruthy();
    expect(screen.getByText("Token:")).toBeTruthy();

    expect(screen.queryByText("Example User")).toBeNull();
    expect(screen.queryByText("Example Token")).toBeNull();
  });

  it("should get auth data from localStorage", async () => {
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockAuthData));

    renderPage();

    expect(axios.defaults.headers.common["Authorization"]).toBe(
      "Example Token"
    );

    expect(screen.getByText("User:Example User")).toBeTruthy();
    expect(screen.getByText("Token:Example Token")).toBeTruthy();
  });
});
