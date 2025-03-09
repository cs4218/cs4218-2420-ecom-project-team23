import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "./productModel";
import categoryModel from "./categoryModel";

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
  await productModel.deleteMany();
  await categoryModel.deleteMany();
});

describe("Product Model Test", () => {
  it("should create and save a product successfully", async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const productData = {
      name: "Smartphone",
      slug: "smartphone",
      description: "A high-end smartphone",
      price: 999.99,
      category: category._id,
      quantity: 10,
      photo: {
        data: Buffer.from("sample image data"),
        contentType: "image/jpeg",
      },
      shipping: true,
    };

    const product = new productModel(productData);
    const savedProduct = await product.save();

    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.name).toBe(productData.name);
    expect(savedProduct.slug).toBe(productData.slug);
    expect(savedProduct.description).toBe(productData.description);
    expect(savedProduct.price).toBe(productData.price);
    expect(savedProduct.category.toString()).toBe(category._id.toString());
    expect(savedProduct.quantity).toBe(productData.quantity);
    expect(
      Buffer.compare(savedProduct.photo.data, productData.photo.data)
    ).toBe(0);
    expect(savedProduct.photo.contentType).toBe(productData.photo.contentType);
    expect(savedProduct.shipping).toBe(productData.shipping);
  });

  it("should not allow saving a product without a required field", async () => {
    const productData = {
      slug: "missing-name",
      description: "Missing name field",
      price: 100,
      quantity: 5,
    };

    const product = new productModel(productData);

    let error;
    try {
      await product.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.category).toBeDefined();
  });

  it("should associate a product with a category", async () => {
    const category = await categoryModel.create({
      name: "Gaming",
      slug: "gaming",
    });

    const productData = {
      name: "Gaming Laptop",
      slug: "gaming-laptop",
      description: "Powerful gaming laptop",
      price: 1299.99,
      category: category._id,
      quantity: 5,
    };

    const product = await productModel.create(productData);

    const foundProduct = await productModel
      .findById(product._id)
      .populate("category");

    expect(foundProduct.category.name).toBe("Gaming");
    expect(foundProduct.category.slug).toBe("gaming");
  });

  it("should allow shipping to be optional and default to undefined", async () => {
    const category = await categoryModel.create({
      name: "Furniture",
      slug: "furniture",
    });

    const productData = {
      name: "Chair",
      slug: "chair",
      description: "Comfortable chair",
      price: 50,
      category: category._id,
      quantity: 20,
    };

    const product = await productModel.create(productData);

    expect(product.shipping).toBeUndefined();
  });
});
