import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryCOntroller,
} from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";
import { jest } from "@jest/globals";

jest.mock("../models/categoryModel.js");

describe("Category Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("Create Category", () => {
    it("should create a category and return 201", async () => {
      req.body.name = "Electronics";

      categoryModel.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue({
        _id: "cat1",
        name: "Electronics",
        slug: "electronics",
      });

      categoryModel.mockImplementation(() => ({ save: mockSave }));

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        name: "Electronics",
      });
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "new category created",
        category: {
          _id: "cat1",
          name: "Electronics",
          slug: "electronics",
        },
      });
    });

    it("should return error if category already exists", async () => {
      req.body.name = "Electronics";
      categoryModel.findOne.mockResolvedValue({ name: "Electronics" });

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

    it("should return 500 on error", async () => {
      req.body.name = "Electronics";
      categoryModel.findOne.mockRejectedValue(new Error("Database error"));

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error in Category",
      });
    });
  });

  describe("Update Category", () => {
    it("should update a category and return 200", async () => {
      req.body.name = "Updated Electronics";
      req.params.id = "cat1";
      categoryModel.findByIdAndUpdate.mockResolvedValue({
        _id: "cat1",
        name: "Updated Electronics",
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
        category: { _id: "cat1", name: "Updated Electronics" },
      });
    });

    it("should return 500 on error", async () => {
      req.body.name = "Updated Electronics";
      req.params.id = "cat1";
      categoryModel.findByIdAndUpdate.mockRejectedValue(
        new Error("Update failed")
      );

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
    it("should delete a category and return 200", async () => {
      req.params.id = "cat1";
      categoryModel.findByIdAndDelete.mockResolvedValue({});

      await deleteCategoryCOntroller(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("cat1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Categry Deleted Successfully",
      });
    });

    it("should return 500 on error", async () => {
      req.params.id = "cat1";
      categoryModel.findByIdAndDelete.mockRejectedValue(
        new Error("Delete failed")
      );

      await deleteCategoryCOntroller(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error while deleting category",
        error: expect.any(Error),
      });
    });
  });
});
