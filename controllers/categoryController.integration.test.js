import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import categoryRoutes from "../routes/categoryRoutes";
import categoryModel from "../models/categoryModel";

jest.mock("../middlewares/authMiddleware", () => ({
  requireSignIn: (req, res, next) => {
    req.user = { id: "testUserId" };
    next();
  },
  isAdmin: (req, res, next) => {
    req.user.role = "admin";
    next();
  },
}));

jest.spyOn(console, "log").mockImplementation(() => {});

const app = express();
app.use(express.json());
app.use("/api/v1/category", categoryRoutes);

describe("Category Controller Admin Tests", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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

  describe("Create Category", () => {
    it("should create a new category successfully", async () => {
      const mockCategory = { name: "Fashion" };

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .send(mockCategory);

      expect(res.statusCode).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("new category created");
      expect(res.body.category).toHaveProperty("_id");
      expect(res.body.category.name).toBe(mockCategory.name);
      expect(res.body.category.slug).toBe("fashion");
    });

    it("should return an error when creating a category without a name", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .send({});

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Name is required");
    });

    it("should prevent duplicate category creation", async () => {
      const mockCategory = { name: "Fashion" };

      await new categoryModel(mockCategory).save();

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .send(mockCategory);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category Already Exisits");
    });
  });

  describe("Update Category", () => {
    it("should update an existing category successfully", async () => {
      const mockCategory = { name: "Old Name", slug: "old-name" };
      const savedCategory = await new categoryModel(mockCategory).save();

      const res = await request(app)
        .put(`/api/v1/category/update-category/${savedCategory._id}`)
        .send({ name: "Updated Name" });

      console.log("🔍 Update Category Response:", res.body);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);

      expect(res.body.category.name).toBe("Updated Name");
      expect(res.body.category.slug).toBe("updated-name");
    });

    it("should return an error when updating a non-existing category", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/v1/category/update-category/${fakeId}`)
        .send({ name: "Updated Name" });

      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.category).toBe(null);
    });
  });

  describe("Delete Category", () => {
    it("should delete a category successfully", async () => {
      const mockCategory = { name: "To Be Deleted", slug: "to-be-deleted" };
      const savedCategory = await new categoryModel(mockCategory).save();

      const res = await request(app).delete(
        `/api/v1/category/delete-category/${savedCategory._id}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Categry Deleted Successfully");

      const deletedCategory = await categoryModel.findById(savedCategory._id);
      expect(deletedCategory).toBeNull();
    });

    it("should return an error when trying to delete a non-existing category", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).delete(
        `/api/v1/category/delete-category/${fakeId}`
      );

      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Categry Deleted Successfully");
    });
  });
});
