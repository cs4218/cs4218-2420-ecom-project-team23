import braintree, { Environment } from "braintree";
import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController,
  createProductController,
  updateProductController,
  deleteProductController,
} from "./productController";
import categoryModel from "../models/categoryModel";
import orderModel from "../models/orderModel";
import productModel from "../models/productModel";
import slugify from "slugify";

jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");

describe("Product Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console logs and errors for all tests
    // jest.spyOn(console, "log").mockImplementation(() => {});
    // jest.spyOn(console, "error").mockImplementation(() => {});

    req = {};
    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe("getProductController", () => {
    it("should return all products successfully", async () => {
      const mockProducts = [
        { _id: "1", name: "Product 1", category: "Category 1" },
        { _id: "2", name: "Product 2", category: "Category 2" },
      ];

      productModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      });

      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: mockProducts.length,
        message: "AllProducts",
        products: mockProducts,
      });
    });

    it("should handle errors and return status 500", async () => {
      const mockError = new Error("Database error");

      jest.spyOn(console, "log").mockImplementation(() => {});

      productModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(mockError),
      });

      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in getting products",
        error: mockError.message,
      });

      console.log.mockRestore();
    });
  });

  describe("getSingleProductController", () => {
    beforeEach(() => {
      req = {
        params: { slug: "product-1" },
      };
    });

    it("should return a single product successfully", async () => {
      const mockProduct = {
        _id: "1",
        name: "Product 1",
        slug: "product-1",
        category: "category123",
      };

      productModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProduct),
      });

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: mockProduct,
      });
    });

    it("should return null if product is not found", async () => {
      productModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null),
      });

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: null,
      });
    });

    it("should return 500 on database error", async () => {
      const mockError = new Error("Database error");

      jest.spyOn(console, "log").mockImplementation(() => {});

      productModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(mockError),
      });

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting single product",
        error: mockError,
      });

      console.log.mockRestore();
    });
  });

  describe("productPhotoController", () => {
    beforeEach(() => {
      req = { params: { pid: "product123" } };
      res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it("should return the product photo successfully", async () => {
      const mockProduct = {
        _id: "product123",
        photo: { data: Buffer.from("mock-image"), contentType: "image/jpeg" },
      };

      productModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProduct),
      });

      await productPhotoController(req, res);

      expect(productModel.findById).toHaveBeenCalledWith("product123");
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
    });

    it("should handle missing product photo gracefully", async () => {
      // Suppress console log here because null cannot be read with photo
      jest.spyOn(console, "log").mockImplementation(() => {});

      productModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await productPhotoController(req, res);

      expect(res.status).not.toHaveBeenCalledWith(200);

      console.log.mockRestore();
    });

    it("should return 500 on database error", async () => {
      const mockError = new Error("Database error");

      jest.spyOn(console, "log").mockImplementation(() => {});

      productModel.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(mockError),
      });

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting photo",
        error: mockError,
      });

      console.log.mockRestore();
    });
  });

  describe("productFiltersController", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = {
        body: {
          checked: [],
          radio: [],
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it("should filter products by category", async () => {
      req.body.checked = ["category123"]; // Filtering by category
      const mockProducts = [
        { _id: "1", name: "Product 1", category: "category123" },
        { _id: "2", name: "Product 2", category: "category123" },
      ];

      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: ["category123"],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("should filter products by price range", async () => {
      req.body.radio = [10, 50]; // Filtering by price range
      const mockProducts = [
        { _id: "1", name: "Product A", price: 20 },
        { _id: "2", name: "Product B", price: 40 },
      ];

      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        price: { $gte: 10, $lte: 50 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("should filter products by category and price range", async () => {
      req.body.checked = ["category123"]; // Filtering by category
      req.body.radio = [10, 50]; // Filtering by price range
      const mockProducts = [
        { _id: "1", name: "Product X", category: "category123", price: 30 },
        { _id: "2", name: "Product Y", category: "category123", price: 45 },
      ];

      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: ["category123"],
        price: { $gte: 10, $lte: 50 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("should return all products when no filters are applied", async () => {
      req.body.checked = [];
      req.body.radio = [];
      const mockProducts = [
        { _id: "1", name: "Product 1", category: "categoryA" },
        { _id: "2", name: "Product 2", category: "categoryB" },
      ];

      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("should return 400 on database error", async () => {
      const mockError = new Error("Database error");

      jest.spyOn(console, "log").mockImplementation(() => {});

      productModel.find.mockRejectedValue(mockError);

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while filtering products",
        error: mockError,
      });

      console.log.mockRestore();
    });
  });

  describe("productCountController", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it("should return the total product count successfully", async () => {
      const mockTotalCount = 25;

      productModel.find.mockReturnValue({
        estimatedDocumentCount: jest.fn().mockResolvedValue(mockTotalCount),
      });

      await productCountController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: mockTotalCount,
      });
    });

    it("should return 400 on database error", async () => {
      const mockError = new Error("Database error");

      jest.spyOn(console, "log").mockImplementation(() => {});

      productModel.find.mockReturnValue({
        estimatedDocumentCount: jest.fn().mockRejectedValue(mockError),
      });

      await productCountController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Error in product count",
        error: mockError,
        success: false,
      });

      console.log.mockRestore();
    });
  });

  describe("productListController", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = { params: { page: "1" } };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it("should return paginated products successfully", async () => {
      const mockProducts = [
        { _id: "1", name: "Product 1", price: 100 },
        { _id: "2", name: "Product 2", price: 200 },
      ];

      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      });

      await productListController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("should handle invalid page numbers gracefully", async () => {
      req.params.page = "invalid"; // Invalid page number

      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });

      await productListController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [],
      });
    });

    it("should return an empty array when no products are found", async () => {
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });

      await productListController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [],
      });
    });

    it("should return 400 on database error", async () => {
      const mockError = new Error("Database error");

      jest.spyOn(console, "log").mockImplementation(() => {});

      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(mockError),
      });

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in per page ctrl",
        error: mockError,
      });

      console.log.mockRestore();
    });
  });

  describe("searchProductController", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        params: { keyword: "test" },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    it("should return products matching the keyword", async () => {
      const mockProducts = [
        { _id: "1", name: "Test Product 1", description: "Some description" },
        {
          _id: "2",
          name: "Another test item",
          description: "Another description",
        },
      ];

      productModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProducts),
      });

      await searchProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "test", $options: "i" } },
          { description: { $regex: "test", $options: "i" } },
        ],
      });

      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    it("should return an empty array if no products match the keyword", async () => {
      productModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await searchProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "test", $options: "i" } },
          { description: { $regex: "test", $options: "i" } },
        ],
      });

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should return 400 on database error", async () => {
      const mockError = new Error("Database error");

      jest.spyOn(console, "log").mockImplementation(() => {});

      productModel.find.mockReturnValue({
        select: jest.fn().mockRejectedValue(mockError),
      });

      await searchProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in search product API",
        error: mockError,
      });

      console.log.mockRestore();
    });
  });

  describe("relatedProductController", () => {
    let mockReq, mockRes;

    beforeEach(() => {
      jest.clearAllMocks();
      mockReq = {
        params: {
          pid: "product123",
          cid: "category123",
        },
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it("should return related products successfully", async () => {
      const mockProducts = [
        { _id: "1", name: "Product A", category: "category123" },
        { _id: "2", name: "Product B", category: "category123" },
        { _id: "3", name: "Product C", category: "category123" },
      ];

      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProducts),
      });

      await relatedProductController(mockReq, mockRes);

      expect(productModel.find).toHaveBeenCalledWith({
        category: "category123",
        _id: { $ne: "product123" },
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("should return an empty array if no related products are found", async () => {
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      });

      await relatedProductController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: true,
        products: [],
      });
    });

    it("should return 400 on database error", async () => {
      const mockError = new Error("Database error");

      jest.spyOn(console, "log").mockImplementation(() => {});

      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(mockError),
      });

      await relatedProductController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting related products",
        error: mockError,
      });

      console.log.mockRestore();
    });
  });

  describe("productCategoryController", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = { params: { slug: "electronics" } };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it("should return products by category successfully", async () => {
      const mockCategory = {
        _id: "cat123",
        name: "Electronics",
        slug: "electronics",
      };
      const mockProducts = [
        { _id: "1", name: "Laptop", category: mockCategory },
        { _id: "2", name: "Smartphone", category: mockCategory },
      ];

      categoryModel.findOne.mockResolvedValue(mockCategory);
      productModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProducts),
      });

      await productCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: "electronics",
      });
      expect(productModel.find).toHaveBeenCalledWith({
        category: mockCategory,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: mockCategory,
        products: mockProducts,
      });
    });

    it("should return empty array if category is not found", async () => {
      categoryModel.findOne.mockResolvedValue(null);

      productModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      });

      await productCategoryController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({ category: null });
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: null,
        products: [],
      });
    });

    it("should return 400 on database error", async () => {
      const mockError = new Error("Database error");

      jest.spyOn(console, "log").mockImplementation(() => {});

      categoryModel.findOne.mockRejectedValue(mockError);

      await productCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: "electronics",
      });
      expect(productModel.find).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting products",
        error: mockError,
      });

      console.log.mockRestore();
    });
  });
});

// Required to mock this way because we cannot use .prototype due to the fact that there is chaining in the form of clientToken.generate
jest.mock("braintree", () => {
  const mockGenerate = jest.fn();
  const mockSale = jest.fn();
  return {
    BraintreeGateway: jest.fn(() => ({
      clientToken: {
        generate: mockGenerate,
      },
      transaction: {
        sale: mockSale,
      },
    })),
    Environment: {
      Sandbox: "sandbox",
    },
    __mockGenerate: mockGenerate, // required to used in tests later on
    __mockSale: mockSale, // required to used in tests later on
  };
});

jest.mock("../models/orderModel.js");

describe("Payment Controllers", () => {
  describe("BrainTree Token Controller Test", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = null;

      res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
    });

    it("should generate and send back client token successfully", async () => {
      const mockResponse = { clientToken: "token123" };
      braintree.__mockGenerate.mockImplementation((_, functionToBeCalled) => {
        functionToBeCalled(null, mockResponse); // null because we do not want any err
      });

      await braintreeTokenController(req, res);

      expect(res.send).toHaveBeenCalledWith(mockResponse);
    });

    it("should handle errors and return status 500", async () => {
      const mockError = new Error("Braintree error");
      braintree.__mockGenerate.mockImplementation((_, functionToBeCalled) => {
        functionToBeCalled(mockError, null); // null because there is an err
      });

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
    });
  });

  describe("BrainTree Payment Controller Test", () => {
    let req, res;
    const mockUserId = "user123";
    const mockCart = [
      { _id: "product1", name: "Infinity Gaunlet", price: 50 },
      { _id: "product2", name: "Chair", price: 10 },
      { _id: "product3", name: "Table", price: 30 },
    ];

    beforeEach(() => {
      jest.clearAllMocks();

      req = {
        user: {
          _id: mockUserId,
        },
        body: {
          nonce: "payment method 1",
          cart: mockCart,
        },
      };

      res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should pay successfully", async () => {
      const mockResult = { success: true };
      braintree.__mockSale.mockImplementation((_, functionToBeCalled) => {
        functionToBeCalled(null, mockResult); // null because we do not want err
      });
      orderModel.prototype.save = jest.fn();

      await brainTreePaymentController(req, res);

      expect(orderModel.prototype.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it("should handle errors and return status 500", async () => {
      const mockError = new Error("Braintree error");
      braintree.__mockSale.mockImplementation((_, functionToBeCalled) => {
        functionToBeCalled(mockError, null); // null because there is an err
      });

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
    });
  });
});

describe("Product Controller - Create, Update & Delete Product", () => {
  let req, res, mockProductInstance, mockUpdatedProduct;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, fields: {}, files: {} };
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    // Mock product instance
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

    // Mock updated product
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

    // Mocking Mongoose methods
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
