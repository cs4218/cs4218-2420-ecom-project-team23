import { jest } from "@jest/globals";
import {
  createProductController,
  updateProductController,
  deleteProductController,
} from "./productController.js";
import productModel from "../models/productModel.js";
import slugify from "slugify";

jest.mock("../models/productModel.js");

describe("Product Controller - Create, Update & Delete Product", () => {
  let req, res, mockProductInstance, mockUpdatedProduct;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, fields: {}, files: {} };
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    mockProductInstance = {
      _id: "prod1",
      name: "iPhone 15",
      description: "Latest Apple phone",
      price: 1200,
      category: "cat1",
      quantity: 5,
      shipping: true,
      slug: slugify("iPhone 15"),
      save: jest.fn().mockResolvedValue(true),
    };

    mockUpdatedProduct = {
      _id: "prod1",
      name: "iPhone 15 Pro",
      description: "Updated Apple phone",
      price: 1400,
      category: "cat1",
      quantity: 10,
      shipping: true,
      slug: slugify("iPhone 15 Pro"),
      photo: {
        data: Buffer.from("mockPhoto"),
        contentType: "image/png",
      },
      save: jest.fn().mockResolvedValue(true),
    };

    productModel.mockImplementation(() => mockProductInstance);
    productModel.create.mockResolvedValue(mockProductInstance);
    productModel.findByIdAndUpdate = jest
      .fn()
      .mockResolvedValue(mockUpdatedProduct);
    productModel.findByIdAndDelete = jest.fn().mockResolvedValue(true);
  });

  describe("Create Product", () => {
    it("should create a product successfully", async () => {
      req.fields = {
        name: "iPhone 15",
        description: "Latest Apple phone",
        price: 1200,
        category: "cat1",
        quantity: 5,
        shipping: true,
      };

      await createProductController(req, res);

      expect(mockProductInstance.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Created Successfully",
        products: mockProductInstance,
      });
    });

    it("should return 500 when missing required fields", async () => {
      req.fields = { name: "iPhone 15" };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Description is Required",
      });
    });
  });

  describe("Update Product", () => {
    it("should update a product successfully", async () => {
      req.params.pid = "prod1";
      req.fields = {
        name: "iPhone 15 Pro",
        description: "Updated Apple phone",
        price: 1400,
        category: "cat1",
        quantity: 10,
        shipping: true,
      };
      req.files = {};

      await updateProductController(req, res);

      expect(productModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "prod1",
        { ...req.fields, slug: slugify(req.fields.name) },
        { new: true }
      );

      expect(mockUpdatedProduct.save).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Updated Successfully",
        products: mockUpdatedProduct,
      });
    });

    it("should return 500 when missing required fields", async () => {
      req.params.pid = "prod1";
      req.fields = {};
      req.files = {};

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Name is Required",
      });
    });
  });

  describe("Delete Product", () => {
    it("should delete a product successfully", async () => {
      req.params.pid = "prod1";

      productModel.findByIdAndDelete.mockResolvedValue({});

      await deleteProductController(req, res);

      expect(productModel.findByIdAndDelete).toHaveBeenCalledTimes(1);
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("prod1");
    });

    it("should return 500 when an error occurs", async () => {
      req.params.pid = "prod1";

      await deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while deleting product",
        error: expect.any(Error),
      });
    });
  });
});
