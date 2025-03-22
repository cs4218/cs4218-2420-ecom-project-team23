import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import slugify from "slugify";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";
import categoryModel from "../models/categoryModel";
import productModel from "../models/productModel";
import productRoutes from "../routes/productRoutes";
import { hashPassword } from "../helpers/authHelper";

jest.setTimeout(30000);

jest.mock("express-formidable", () => {
  return jest.fn(() => (req, res, next) => {
    req.fields = req.body;
    req.files = {};
    next();
  });
});

jest.mock("../middlewares/authMiddleware", () => ({
  requireSignIn: (req, res, next) => {
    req.user = { _id: "67d0745ec9e0ef3de7eae0e8", id: "testUserId", role: "admin" };
    next();
  },
  isAdmin: (req, res, next) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .send({ success: false, message: "Admin access required" });
    }
    next();
  },
}));

const validToken = "validToken";

// Supress Console logs
jest.spyOn(console, "log").mockImplementation(() => {});

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn().mockImplementation((token) => {
    if (token == validToken) {
      return {
        _id: "67d0745ec9e0ef3de7eae0e8",
      };
    } else {
      return undefined;
    }
  }),
  sign: jest.fn().mockImplementation(() => validToken),
}));

const app = express();
app.use(express.json());
app.use("/api/v1/product", productRoutes);

describe("Controller Tests", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    mongoose.connect(mongoUri, {});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await userModel.deleteMany();
    await categoryModel.deleteMany();
    await productModel.deleteMany();
    await orderModel.deleteMany();
  });

  describe("Create Product", () => {
    it("should create a new product successfully", async () => {
      const mockCategory = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const mockProduct = {
        name: "iPhone 13",
        slug: slugify("iPhone 13"),
        description: "Latest Apple smartphone",
        price: 999,
        category: mockCategory._id,
        quantity: 10,
        shipping: true,
      };

      const res = await request(app)
        .post("/api/v1/product/create-product")
        .send(mockProduct);

      console.log("🔍 Create Product Response:", res.body);

      expect(res.statusCode).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Product Created Successfully");
      expect(res.body.products).toHaveProperty("_id");
      expect(res.body.products.name).toBe(mockProduct.name);
      expect(res.body.products.price).toBe(mockProduct.price);
    });

    it("should return an error when creating a product without a name", async () => {
      const res = await request(app)
        .post("/api/v1/product/create-product")
        .send({
          description: "A product without a name",
          price: 500,
          quantity: 5,
          shipping: true,
        });

      console.log("🔍 Create Product Error Response:", res.body);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Name is Required");
    });
  });

  describe("Update Product", () => {
    it("should update an existing product successfully", async () => {
      const mockCategory = await new categoryModel({
        name: "Appliances",
        slug: "appliances",
      }).save();

      const mockProduct = await new productModel({
        name: "Washing Machine",
        slug: slugify("Washing Machine"),
        description: "Efficient and energy-saving",
        price: 700,
        category: mockCategory._id,
        quantity: 5,
        shipping: false,
      }).save();

      const updatedData = {
        name: "Smart Washing Machine",
        slug: slugify("Smart Washing Machine"),
        description: "Efficient and energy-saving",
        price: 750,
        category: mockCategory._id,
        quantity: 5,
        shipping: false,
      };

      const res = await request(app)
        .put(`/api/v1/product/update-product/${mockProduct._id}`)
        .send(updatedData);

      console.log("🔍 Update Product Response:", res.body);

      expect(res.statusCode).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Product Updated Successfully");
      expect(res.body.products.name).toBe(updatedData.name);
      expect(res.body.products.price).toBe(updatedData.price);
    });

    it("should return an error when updating a non-existing product", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/v1/product/update-product/${fakeId}`)
        .send({ name: "Updated Product Name" });

      console.log("🔍 Update Non-Existing Product Response:", res.body);

      expect(res.statusCode).toBe(500);
    });
  });

  describe("Delete Product", () => {
    it("should delete a product successfully", async () => {
      const mockCategory = await new categoryModel({
        name: "Furniture",
        slug: "furniture",
      }).save();

      const mockProduct = await new productModel({
        name: "Wooden Table",
        slug: slugify("Wooden Table"),
        description: "Elegant dining table",
        price: 450,
        category: mockCategory._id,
        quantity: 3,
        shipping: true,
      }).save();

      const res = await request(app).delete(
        `/api/v1/product/delete-product/${mockProduct._id}`
      );

      console.log("🔍 Delete Product Response:", res.body);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Product Deleted successfully");

      const deletedProduct = await productModel.findById(mockProduct._id);
      expect(deletedProduct).toBeNull();
    });

    it("should return an error when trying to delete a non-existing product", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).delete(
        `/api/v1/product/delete-product/${fakeId}`
      );

      console.log("🔍 Delete Non-Existing Product Response:", res.body);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Product Deleted successfully");
    });
  });

  describe("BrainTree Token Controller Test", () => {
    it("should return a real BrainTree Token", async () => {
      // Execute the controller
      const res = await request(app).get("/api/v1/product/braintree/token");
  
      // Check to see if it returns a real braintree token
      expect(res.status).toBe(200);
      expect(res.body.clientToken).toBeDefined();
    });
  });
  
  describe("BrainTree Payment Controller Test", () => {
    it("should process payment successfully", async () => {
      // Save mock data into in-memory db
      const currentPassword = "password";
      const hashedCurrentPassword = await hashPassword(currentPassword);
  
      const mockCategory = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();
  
      const mockProducts = [
        {
          _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e6"),
          name: "product1",
          slug: "product1",
          description: "awesome product 1",
          price: 50,
          category: mockCategory._id,
          quantity: 1,
        },
        {
          _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e5"),
          name: "product2",
          slug: "product2",
          description: "awesome product 2",
          price: 100,
          category: mockCategory._id,
          quantity: 1,
        },
      ];
  
      await new productModel(mockProducts[0]).save();
      await new productModel(mockProducts[1]).save();
  
      const mockUser = await new userModel({
        _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e8"),
        name: "John Doe",
        email: "example@gmail.com",
        password: hashedCurrentPassword,
        phone: "91234567",
        address: "example address",
        answer: "ans",
      }).save();
  
      // Construct the req.body
      const nonce = "fake-valid-nonce"; // valid testing nonce, referenced from https://developer.paypal.com/braintree/docs/reference/general/testing/node
      const cart = [mockProducts[0], mockProducts[1]];
  
      const data = {
        nonce: nonce,
        cart: cart,
      };
  
      // Execute the controller
      const res = await request(app)
        .post("/api/v1/product/braintree/payment")
        .send(data)
        .set("Authorization", validToken);
  
      // Check that the response is correct
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ ok: true });
  
      // Check that a new order was created in the db after a successful payment
      const newlyCreatedOrders = await orderModel.find({ buyer: mockUser._id });
      expect(newlyCreatedOrders.length).toBe(1);
      expect(newlyCreatedOrders[0].toObject()).toMatchObject({
        buyer: mockUser._id,
        products: [mockProducts[0]._id, mockProducts[1]._id],
        status: "Not Process",
      });
    });
  });
});
