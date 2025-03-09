import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useCategory from "./useCategory";

jest.mock("axios");

describe("Use Category Hook Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {}); // to prevent logging during testing
  });

  it("should get all categories successfully", async () => {
    const mockData = {
      data: {
        category: [
          { _id: "category1", name: "Clothing" },
          { _id: "category2", name: "Book" },
          { _id: "category3", name: "Electronics" },
        ],
      },
    };
    axios.get.mockResolvedValue(mockData);
    const { result } = renderHook(() => useCategory());

    await waitFor(() => expect(result.current).toEqual(mockData.data.category));
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  it("should handle errors gracefully", async () => {
    const mockError = new Error("Mock error");
    axios.get.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCategory());

    await waitFor(() => expect(console.log).toHaveBeenCalledWith(mockError));
    expect(result.current).toEqual([])
  });
});
