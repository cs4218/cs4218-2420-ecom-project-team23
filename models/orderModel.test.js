import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import categoryModel from "./categoryModel";
import orderModel from "./orderModel";
import productModel from "./productModel";
import userModel from "./userModel";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear each db before each test
  await orderModel.deleteMany();
  await productModel.deleteMany();
  await userModel.deleteMany();
});

describe("Order Model Test", () => {
  it("should create and save an order successfully", async () => {
    // Create and save data to category, users and products collection
    const mockCategory = new categoryModel({ name: "AI", slug: "ai" });
    const savedCategory = await mockCategory.save();
    const mockUser = new userModel({
      name: "John Doe",
      email: "example@gmail.com",
      password: "password123",
      phone: "91234567",
      address: { street: "23" },
      answer: "ans",
    });
    const savedUser = await mockUser.save();
    const mockProduct = new productModel({
      name: "P1",
      slug: "p1",
      description: "Product 1",
      price: 100,
      category: mockCategory,
      quantity: 1,
    });
    const savedProduct = await mockProduct.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedUser._id).toBeDefined();
    expect(savedProduct._id).toBeDefined();

    const orderData = {
      products: [savedProduct._id],
      payment: { method: "Credit Card", status: "Success" },
      buyer: savedUser._id,
    };

    // Create a new order
    const order = new orderModel(orderData);
    const savedOrder = await order.save();

    expect(savedOrder._id).toBeDefined();
    expect(savedOrder.products).toEqual([savedProduct._id]);
    expect(savedOrder.payment.method).toBe("Credit Card");
    expect(savedOrder.buyer.toString()).toBe(savedUser._id.toString());
    expect(savedOrder.status).toBe("Not Process"); // default value
  });

  it("should require products and buyer fields", async () => {
    const orderData = {
      products: [],
      payment: { method: "Credit Card", status: "Success" },
      buyer: null,
    };

    // Create a new order with missing required fields
    const order = new orderModel(orderData);

    try {
      await order.save();
    } catch (error) {
    console.log("Error caught: ", error); 
      // Mongoose validation errors syntax
      expect(error.errors.products).toBeDefined();
      expect(error.errors.buyer).toBeDefined();
    }
  });
});
