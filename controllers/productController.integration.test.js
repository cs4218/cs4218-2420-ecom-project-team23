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
    req.user = {
      _id: "67d0745ec9e0ef3de7eae0e8",
      id: "testUserId",
      role: "admin",
    };
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

  describe("Get Products Controller", () => {
    it("should return all products", async () => {
      const category = await new categoryModel({
        name: "Books",
        slug: "books",
      }).save();

      await new productModel({
        name: "Twinkle Twinkle Little Star",
        slug: slugify("Twinkle Twinkle Little Star"),
        description: "Interesting book",
        price: 15,
        category: category._id,
        quantity: 10,
      }).save();

      const res = await request(app).get("/api/v1/product/get-product");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
    });
  });

  describe("Get Single Product Controller", () => {
    it("should return product by slug", async () => {
      const category = await categoryModel.create({
        name: "Toys",
        slug: "toys",
      });

      const product = await productModel.create({
        name: "Lego",
        slug: "lego",
        description: "Building blocks",
        price: 40,
        category: category._id,
        quantity: 5,
      });

      const res = await request(app).get(
        `/api/v1/product/get-product/${product.slug}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.product.name).toBe("Lego");
      expect(res.body.product.slug).toBe("lego");
    });

    it("should return null if no product is found", async () => {
      const res = await request(app).get(
        "/api/v1/product/get-product/non-existent-slug"
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product).toBeNull();
      expect(res.body.message).toBe("Single Product Fetched");
    });
  });

  describe("Product Photo Controller", () => {
    it("should return product photo", async () => {
      const category = await categoryModel.create({
        name: "Cameras",
        slug: "cameras",
      });

      const product = await new productModel({
        name: "Canon Camera",
        slug: slugify("Canon Camera"),
        description: "Professional camera",
        price: 1200,
        category: category._id,
        quantity: 3,
        shipping: true,
      }).save();

      product.photo = {
        data: Buffer.from("mock-image"),
        contentType: "image/jpeg",
      };
      await product.save();

      const res = await request(app).get(
        `/api/v1/product/product-photo/${product._id}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toBe("image/jpeg");
      expect(res.body).toBeInstanceOf(Buffer);
    });

    it("should return 500 if product does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(
        `/api/v1/product/product-photo/${fakeId}`
      );
      expect(res.statusCode).toBe(500);
    });
  });

  describe("Product Filters Controller", () => {
    it("should filter by category", async () => {
      const categoryMatch = await categoryModel.create({
        name: "Furniture",
        slug: "furniture",
      });

      const categoryIgnore = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });

      await productModel.create([
        {
          name: "Chair",
          slug: slugify("Chair"),
          description: "Comfortable chair",
          price: 100,
          category: categoryMatch._id,
          quantity: 2,
        },
        {
          name: "Table",
          slug: slugify("Table"),
          description: "Wooden table",
          price: 150,
          category: categoryMatch._id,
          quantity: 1,
        },
        {
          name: "TV",
          slug: slugify("TV"),
          description: "Smart TV",
          price: 500,
          category: categoryIgnore._id,
          quantity: 3,
        },
      ]);

      const res = await request(app)
        .post("/api/v1/product/product-filters")
        .send({ checked: [categoryMatch._id], radio: [] });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const names = res.body.products.map((p) => p.name);
      expect(names).toEqual(expect.arrayContaining(["Chair", "Table"]));
      expect(names).not.toContain("TV");
    });

    it("should filter by price range", async () => {
      const category = await categoryModel.create({
        name: "Stationery",
        slug: "stationery",
      });

      await productModel.create([
        {
          name: "Pen",
          slug: slugify("Pen"),
          description: "Blue ballpoint pen",
          price: 5,
          category: category._id,
          quantity: 50,
        },
        {
          name: "Pencil",
          slug: slugify("Pencil"),
          description: "HB Pencil",
          price: 3,
          category: category._id,
          quantity: 100,
        },
        {
          name: "Fancy Notebook",
          slug: slugify("Fancy Notebook"),
          description: "Leather notebook",
          price: 50,
          category: category._id,
          quantity: 20,
        },
      ]);

      const res = await request(app)
        .post("/api/v1/product/product-filters")
        .send({ checked: [], radio: [0, 10] });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const names = res.body.products.map((p) => p.name);
      expect(names).toEqual(expect.arrayContaining(["Pen", "Pencil"]));
      expect(names).not.toContain("Fancy Notebook");
    });

    it("should return all products when no filters are passed", async () => {
      const category = await categoryModel.create({
        name: "Misc",
        slug: "misc",
      });

      await productModel.create([
        {
          name: "Item A",
          slug: slugify("Item A"),
          description: "Some item",
          price: 20,
          category: category._id,
          quantity: 5,
        },
        {
          name: "Item B",
          slug: slugify("Item B"),
          description: "Another item",
          price: 30,
          category: category._id,
          quantity: 3,
        },
      ]);

      const res = await request(app)
        .post("/api/v1/product/product-filters")
        .send({ checked: [], radio: [] });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const names = res.body.products.map((p) => p.name);
      expect(names).toEqual(expect.arrayContaining(["Item A", "Item B"]));
    });
  });

  describe("Product Count Controller", () => {
    it("should return the total number of products", async () => {
      const category = await categoryModel.create({
        name: "Books",
        slug: "books",
      });

      await productModel.create([
        {
          name: "Fantasy Book",
          slug: slugify("Fantasy Book"),
          description: "Interesting",
          price: 10,
          category: category._id,
          quantity: 5,
        },
        {
          name: "Sci-fi Book",
          slug: slugify("Sci-fi Book"),
          description: "Also interesting",
          price: 12,
          category: category._id,
          quantity: 3,
        },
      ]);

      const res = await request(app).get("/api/v1/product/product-count");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.total).toBe("number");
      expect(res.body.total).toBe(2);
    });
  });

  describe("Product List Controller", () => {
    it("should return first page of paginated products", async () => {
      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });

      const created = [];
      for (let i = 1; i <= 10; i++) {
        const product = await productModel.create({
          name: `Product ${i}`,
          slug: slugify(`Product ${i}`),
          description: `Description ${i}`,
          price: i * 10,
          category: category._id,
          quantity: 5,
        });
        created.push(product);
        await new Promise((r) => setTimeout(r, 10)); // Add 10ms delay to populate
      }

      const res = await request(app).get("/api/v1/product/product-list/1");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(6);

      const expectedNames = created
        .slice(-6)
        .reverse()
        .map((p) => p.name);

      const returnedNames = res.body.products.map((p) => p.name);

      expect(returnedNames).toEqual(expectedNames);
    });

    it("should return an empty array when no products are available on the page", async () => {
      const res = await request(app).get("/api/v1/product/product-list/99");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(0);
    });
  });

  describe("Search Product Controller", () => {
    it("should return matching products by keyword in name or description", async () => {
      const category = await categoryModel.create({
        name: "Books",
        slug: "books",
      });

      await productModel.create([
        {
          name: "JavaScript Guide",
          slug: slugify("JavaScript Guide"),
          description: "A comprehensive JS book",
          price: 30,
          category: category._id,
          quantity: 10,
        },
        {
          name: "Frontend Handbook",
          slug: slugify("Frontend Handbook"),
          description: "Learn JavaScript the right way",
          price: 25,
          category: category._id,
          quantity: 5,
        },
        {
          name: "Python Guide",
          slug: slugify("Python Guide"),
          description: "Advanced Python coding",
          price: 50,
          category: category._id,
          quantity: 7,
        },
      ]);

      const res = await request(app).get("/api/v1/product/search/javascript");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      const names = res.body.map((p) => p.name);
      expect(names).toContain("JavaScript Guide");
      expect(names).toContain("Frontend Handbook");
      expect(names).not.toContain("Python Cookbook");
    });

    it("should return products that partially match the keyword", async () => {
      const category = await categoryModel.create({
        name: "Music",
        slug: "music",
      });

      await productModel.create([
        {
          name: "Guitar Strings",
          slug: slugify("Guitar Strings"),
          description: "Durable strings for guitar",
          price: 15,
          category: category._id,
          quantity: 20,
        },
        {
          name: "Electric Guitar",
          slug: slugify("Electric Guitar"),
          description: "High quality instrument",
          price: 300,
          category: category._id,
          quantity: 5,
        },
        {
          name: "Drumsticks",
          slug: slugify("Drumsticks"),
          description: "For drumming",
          price: 20,
          category: category._id,
          quantity: 15,
        },
      ]);

      const res = await request(app).get("/api/v1/product/search/guit");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const returnedNames = res.body.map((p) => p.name);
      expect(returnedNames).toContain("Guitar Strings");
      expect(returnedNames).toContain("Electric Guitar");
      expect(returnedNames).not.toContain("Drumsticks");
    });

    it("should return empty array if no products match", async () => {
      const res = await request(app).get(
        "/api/v1/product/search/unknownkeyword"
      );

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  describe("Related Product Controller", () => {
    it("should return related products in same category excluding original product", async () => {
      const category = await categoryModel.create({
        name: "Gaming",
        slug: "gaming",
      });

      const mainProduct = await productModel.create({
        name: "Gaming Mouse",
        slug: slugify("Gaming Mouse"),
        description: "High DPI mouse",
        price: 60,
        category: category._id,
        quantity: 10,
      });

      await productModel.create({
        name: "Gaming Keyboard",
        slug: slugify("Gaming Keyboard"),
        description: "Mechanical RGB keyboard",
        price: 100,
        category: category._id,
        quantity: 5,
      });

      const unrelatedCategory = await categoryModel.create({
        name: "Office",
        slug: "office",
      });

      await productModel.create({
        name: "Office Chair",
        slug: slugify("Office Chair"),
        description: "Ergonomic chair",
        price: 120,
        category: unrelatedCategory._id,
        quantity: 2,
      });

      const res = await request(app).get(
        `/api/v1/product/related-product/${mainProduct._id}/${category._id}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products.length).toBe(1);
      expect(res.body.products[0].name).toBe("Gaming Keyboard");
    });

    it("should return empty array when no related products exist", async () => {
      const category = await categoryModel.create({
        name: "Speakers",
        slug: "speakers",
      });

      const mainProduct = await productModel.create({
        name: "Bluetooth Speaker",
        slug: slugify("Bluetooth Speaker"),
        description: "Portable speaker",
        price: 80,
        category: category._id,
        quantity: 3,
      });

      const res = await request(app).get(
        `/api/v1/product/related-product/${mainProduct._id}/${category._id}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(0);
    });
  });

  describe("Product Category Controller", () => {
    it("should return products by category slug", async () => {
      const category = await categoryModel.create({
        name: "Accessories",
        slug: "accessories",
      });

      await productModel.create([
        {
          name: "Watch",
          slug: slugify("Watch"),
          description: "Stylish wrist watch",
          price: 150,
          category: category._id,
          quantity: 8,
        },
        {
          name: "Belt",
          slug: slugify("Belt"),
          description: "Leather belt",
          price: 40,
          category: category._id,
          quantity: 5,
        },
      ]);

      const res = await request(app).get(
        `/api/v1/product/product-category/${category.slug}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products.length).toBe(2);
      expect(res.body.category.name).toBe("Accessories");
    });

    it("should return empty array if category does not exist", async () => {
      const res = await request(app).get(
        "/api/v1/product/product-category/non-existent-category"
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toEqual([]);
      expect(res.body.category).toBeNull();
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
