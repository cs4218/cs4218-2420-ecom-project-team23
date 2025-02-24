import { jest } from "@jest/globals";
import {
  categoryController,
  singleCategoryController,
} from "./categoryController";
import categoryModel from "../models/categoryModel";

jest.mock("../models/categoryModel.js");

describe("Category Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, "log").mockImplementation(() => {}); // to prevent logging during testing

    req = null;

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it("should get all categories successfully", async () => {
    const mockCategories = [
      { _id: "category1", name: "Clothing" },
      { _id: "category2", name: "Book" },
      { _id: "category3", name: "Electronics" },
    ];
    categoryModel.find = jest.fn().mockResolvedValue(mockCategories);

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: mockCategories,
    });
  });

  it("should handle errors and return status 500", async () => {
    const mockError = new Error("Database error");
    categoryModel.find = jest.fn().mockRejectedValue(mockError);

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: "Error while getting all categories",
    });
  });
});

describe("Single Category Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, "log").mockImplementation(() => {}); // to prevent logging during testing

    req = {
      params: {
        slug: "slug1",
      },
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it("should get the single category successfully", async () => {
    const mockCategory = { _id: "category1", name: "Clothing", slug: "slug1" };
    categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Get single category successfully",
      category: mockCategory,
    });
  });

  it("should handle errors and return status 500", async () => {
    const mockError = new Error("Database error");
    categoryModel.findOne = jest.fn().mockRejectedValue(mockError);

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: "Error while getting single category",
    });
  });
});
