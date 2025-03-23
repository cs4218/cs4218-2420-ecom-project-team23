import { jest } from "@jest/globals";
import {
  categoryController,
  singleCategoryController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryCOntroller,
} from "./categoryController";
import categoryModel from "../models/categoryModel";
import slugify from "slugify";

jest.mock("../models/categoryModel.js");

describe("Create Category", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});

    req = { body: {}, params: {} };
    res = { send: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  it("should create a new category successfully", async () => {
    req.body.name = "Electronics";
    categoryModel.findOne = jest.fn().mockResolvedValue(null);
    categoryModel.prototype.save = jest.fn().mockResolvedValue({
      _id: "cat1",
      name: "Electronics",
      slug: slugify("Electronics"),
    });

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      name: "Electronics",
    });
    expect(categoryModel.prototype.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "new category created",
      category: { _id: "cat1", name: "Electronics", slug: "Electronics" },
    });
  });

  it("should return 401 if no name is provided", async () => {
    req.body.name = "";

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
  });

  it("should return 200 if category already exists", async () => {
    req.body.name = "Electronics";
    categoryModel.findOne = jest.fn().mockResolvedValue({ name: "Electronics" });

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      name: "Electronics",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Already Exisits",
    });
  });

  it("should return 500 if there is a database error", async () => {
    req.body.name = "Electronics";
    categoryModel.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      name: "Electronics",
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: expect.any(Error),
      message: "Error in Category",
    });
  });
});

describe("Update Category", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});

    req = { body: {}, params: {} };
    res = { send: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  it("should update a category successfully", async () => {
    req.body.name = "Updated Electronics";
    req.params.id = "cat1";
    categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: "cat1",
      name: "Updated Electronics",
      slug: slugify("updated electronics"),
    });

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "cat1",
      { name: "Updated Electronics", slug: "Updated-Electronics" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      messsage: "Category Updated Successfully",
      category: {
        _id: "cat1",
        name: "Updated Electronics",
        slug: "updated-electronics",
      },
    });
  });

  it("should return 500 if there is an error while updating", async () => {
    req.body.name = "Updated Electronics";
    req.params.id = "cat1";
    categoryModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error("Database error"));

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: expect.any(Error),
      message: "Error while updating category",
    });
  });
});

describe("Delete Category", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});

    req = { body: {}, params: {} };
    res = { send: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  it("should delete a category successfully", async () => {
    req.params.id = "cat1";
    categoryModel.findByIdAndDelete = jest.fn().mockResolvedValue({});

    await deleteCategoryCOntroller(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("cat1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Categry Deleted Successfully",
    });
  });

  it("should return 500 if there is an error while deleting", async () => {
    req.params.id = "cat1";
    categoryModel.findByIdAndDelete = jest.fn().mockRejectedValue(new Error("Database error"));

    await deleteCategoryCOntroller(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "error while deleting category",
      error: expect.any(Error),
    });
  });
});

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
