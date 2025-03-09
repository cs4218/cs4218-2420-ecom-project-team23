import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server"; // spins up an actual/real MongoDB server programmatically from within nodejs, for testing or mocking
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
  await categoryModel.deleteMany(); // clear the db before each test
});

describe("Category Model Test", () => {
  it("should create and save a category successfully", async () => {
    const categoryData = { name: "AI", slug: "ai" };
    const category = new categoryModel(categoryData);
    const savedCategory = await category.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe(categoryData.name);
    expect(savedCategory.slug).toBe(categoryData.slug);
  });

  it("should not require a name field when saving", async () => {
    const categoryData = { slug: "uncategorized" };
    const category = new categoryModel(categoryData);
    const savedCategory = await category.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBeUndefined();
    expect(savedCategory.slug).toBe(categoryData.slug);
  });

  it("should store slug in lowercase", async () => {
    const categoryData = { name: "Business", slug: "BUSINESS" };
    const category = new categoryModel(categoryData);
    const savedCategory = await category.save();

    expect(savedCategory.slug).toBe("business");
  });
});
