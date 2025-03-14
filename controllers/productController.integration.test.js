import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";
import categoryModel from "../models/categoryModel";
import productModel from "../models/productModel";
import productRoutes from "../routes/productRoutes";
import { hashPassword } from "../helpers/authHelper";

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

describe("Payment Controllers Tests", () => {
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
