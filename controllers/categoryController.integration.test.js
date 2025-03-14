import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import categoryRoutes from "../routes/categoryRoutes";
import categoryModel from "../models/categoryModel";

// Supress Console logs
jest.spyOn(console, "log").mockImplementation(() => {});

const app = express();
app.use(express.json());
app.use("/api/v1/category", categoryRoutes);

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
    await categoryModel.deleteMany();
  });

  describe("Category Controller Test", () => {
    it("should get all categories successfully", async () => {
      // Save mock data into in-memory db
      const mockCategory1 = {
        name: "Electronics",
        slug: "electronics",
      };
      await new categoryModel(mockCategory1).save();

      const mockCategory2 = {
        name: "Technology",
        slug: "technology",
      };
      await new categoryModel(mockCategory2).save();

      // Execute the controller
      const res = await request(app).get("/api/v1/category/get-category");

      // Check that the return categories are correct
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("All Categories List");
      expect(res.body.category.length).toBe(2);
      expect(res.body.category[0]).toMatchObject(mockCategory1);
      expect(res.body.category[1]).toMatchObject(mockCategory2);
    });
  });

  describe("Single Category Controller Test", () => {
    it("should get a single category successfully", async () => {
      // Save mock data into in-memory db
      const mockCategory = {
        name: "Electronics",
        slug: "electronics",
      };
      await new categoryModel(mockCategory).save();

      // Execute the controller
      const res = await request(app).get(`/api/v1/category/single-category/${mockCategory.slug}`);

      // Check that the return category is correct
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Get single category successfully");
      expect(res.body.category).toMatchObject(mockCategory);
    });
  });
});
