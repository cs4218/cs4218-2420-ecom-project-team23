import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import authRoutes from "../routes/authRoute";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";
import categoryModel from "../models/categoryModel";
import productModel from "../models/productModel";
import { hashPassword, comparePassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";

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
app.use("/api/v1/auth", authRoutes);

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

  describe("Non-Protected Controller Tests", () => {
    describe("Register Controller Test", () => {
      it("should register new user successfully", async () => {
        const userData = {
          name: "John Doe",
          email: "example@gmail.com",
          password: "password",
          phone: "91234567",
          address: "example address",
          answer: "ans",
        };

        const res = await request(app)
          .post("/api/v1/auth/register")
          .send(userData);

        // Check that user is actually saved in the database
        const savedUser = await userModel.findOne({ email: userData.email });

        expect(savedUser).toBeDefined();
        expect(
          comparePassword(userData.password, savedUser.password)
        ).resolves.toBe(true);
        expect(savedUser.toObject()).toMatchObject({
          ...userData,
          password: savedUser.password,
          role: 0,
        });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty("success", true);
        expect(res.body).toHaveProperty(
          "message",
          "User Registered Successfully"
        );
        expect(res.body).toHaveProperty(
          "user",
          expect.objectContaining({
            _id: savedUser._id.toString(),
            name: userData.name,
            email: userData.email,
            address: userData.address,
            answer: userData.answer,
            phone: userData.phone,
            role: 0,
          })
        );
      });

      it("should not register new user if existing (same email)", async () => {
        const savedUser = new userModel({
          name: "Jane Doe",
          email: "example@gmail.com",
          password: "password",
          phone: "91234567",
          address: "example address",
          answer: "ans",
        }).save();

        // Check that savedUser is actually saved in the database
        await expect(
          userModel.findOne({ email: savedUser.email })
        ).resolves.toEqual(expect.objectContaining(savedUser));

        const userData = {
          name: "John Doe",
          email: "example@gmail.com",
          password: "password",
          phone: "91234567",
          address: "example address",
          answer: "ans",
        };

        const res = await request(app)
          .post("/api/v1/auth/register")
          .send(userData);

        // Check that new User is not saved due to existing email
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty(
          "message",
          "Unable to register. If you already have an account, please log in"
        );
      });
    });

    describe("Login Controller Test", () => {
      it("should login existing user successfully given valid credentials", async () => {
        const hashedPassword = await hashPassword("password");

        const mockUser = new userModel({
          name: "Jane Doe",
          email: "example@gmail.com",
          password: hashedPassword,
          phone: "91234567",
          address: "example address",
          answer: "ans",
        });

        const savedUser = await mockUser.save();

        // Login with valid credentials
        const loginData = {
          email: "example@gmail.com",
          password: "password",
        };

        const res = await request(app)
          .post("/api/v1/auth/login")
          .send(loginData);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("success", true);
        expect(res.body).toHaveProperty("message", "Login successfully");
        expect(res.body).toHaveProperty("token", "validToken");
        expect(res.body).toHaveProperty(
          "user",
          expect.objectContaining({
            _id: savedUser._id.toString(),
            name: savedUser.name,
            email: savedUser.email,
            phone: savedUser.phone,
            address: savedUser.address,
            role: savedUser.role,
          })
        );
      });

      it("should not login user if email is not registered", async () => {
        const loginData = {
          email: "example@gmail.com",
          password: "password",
        };

        const res = await request(app)
          .post("/api/v1/auth/login")
          .send(loginData);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("message", "Invalid email or password");
      });

      it("should not login user if incorrect password", async () => {
        const hashedPassword = await hashPassword("password");

        const mockUser = new userModel({
          name: "Jane Doe",
          email: "example@gmail.com",
          password: hashedPassword,
          phone: "91234567",
          address: "example address",
          answer: "ans",
        });

        await mockUser.save();

        // Login with valid credentials
        const loginData = {
          email: "example@gmail.com",
          password: "wrongPassword",
        };

        const res = await request(app)
          .post("/api/v1/auth/login")
          .send(loginData);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("message", "Invalid email or password");
      });
    });

    describe("Forgot Password Controller Test", () => {
      it("should reset password successfully with valid credentials", async () => {
        const mockUser = new userModel({
          name: "Jane Doe",
          email: "example@gmail.com",
          password: "SomeHashedPassword",
          phone: "91234567",
          address: "example address",
          answer: "ans",
        });

        const savedUser = await mockUser.save();

        const userData = {
          email: mockUser.email,
          answer: mockUser.answer,
          newPassword: "newPassword",
        };

        const res = await request(app)
          .post("/api/v1/auth/forgot-password")
          .send(userData);

        const updatedUser = await userModel.findById(savedUser._id);
        await expect(
          comparePassword(userData.newPassword, updatedUser.password)
        ).resolves.toBe(true);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty("success", true);
        expect(res.body).toHaveProperty(
          "message",
          "Password Reset Successfully"
        );
      });

      it("should not reset password with invalid answer", async () => {
        await new userModel({
          name: "Jane Doe",
          email: "example@gmail.com",
          password: "SomeHashedPassword",
          phone: "91234567",
          address: "example address",
          answer: "ans",
        }).save();

        const userData = {
          email: "example@gmail.com",
          answer: "wrongAnswer",
          newPassword: "newPassword",
        };

        const res = await request(app)
          .post("/api/v1/auth/forgot-password")
          .send(userData);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("message", "Invalid Email Or Answer");
      });

      it("should not reset password if user does not exist", async () => {
        const userData = {
          email: "example@gmail.com",
          answer: "ans",
          newPassword: "newPassword",
        };

        const res = await request(app)
          .post("/api/v1/auth/forgot-password")
          .send(userData);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("message", "Invalid Email Or Answer");
      });
    });
  });

  describe("Protected Routes Controller Test", () => {
    describe("Test Controller Test", () => {
      it("should return Error in admin middleware if undefined user", async () => {
        const res = await request(app).get("/api/v1/auth/test");

        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("message", "Error in admin middleware");
      });

      it("should return Protected Route with token if admin", async () => {
        const hashedPassword = await hashPassword("password");

        const mockUser = await new userModel({
          _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e8"),
          name: "John Doe",
          email: "example@gmail.com",
          password: hashedPassword,
          phone: "91234567",
          address: "example address",
          answer: "ans",
          role: "1",
        }).save();

        const res = await request(app)
          .get("/api/v1/auth/test")
          .set("Authorization", validToken);

        expect(res.statusCode).toEqual(200);
        expect(res.text).toEqual("Protected Routes");
      });
    });

    describe("Update Profile Controller Test", () => {
      it("should update profile successfully given valid credentials", async () => {
        const currentPassword = "password";
        const newPassword = "newPassword";
        const hashedCurrentPassword = await hashPassword(currentPassword);

        const mockUser = await new userModel({
          _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e8"),
          name: "John Doe",
          email: "example@gmail.com",
          password: hashedCurrentPassword,
          phone: "91234567",
          address: "example address",
          answer: "ans",
        }).save();

        const data = {
          name: "Jane Doe",
          email: "example@gmail.com",
          password: currentPassword,
          newPassword: newPassword,
          address: "new address",
          phone: "98765432",
        };

        const res = await request(app)
          .put("/api/v1/auth/profile")
          .send(data)
          .set("Authorization", validToken);

        // Check that user is updated correctly
        const updatedUser = await userModel.findById(mockUser._id);
        expect(updatedUser).toBeDefined();
        expect(
          comparePassword(newPassword, updatedUser.password)
        ).resolves.toBe(true);
        expect(updatedUser.toObject()).toMatchObject(
          expect.objectContaining({
            name: "Jane Doe",
            email: "example@gmail.com",
            address: "new address",
            phone: "98765432",
          })
        );

        // Check that response is correct
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty("success", true);
        expect(res.body).toHaveProperty(
          "message",
          "Profile Updated Successfully"
        );
      });

      it("should not update profile fields given empty fields except email and password", async () => {
        const currentPassword = "password";
        const hashedCurrentPassword = await hashPassword(currentPassword);

        const mockUser = await new userModel({
          name: "John Doe",
          email: "example@gmail.com",
          password: hashedCurrentPassword,
          phone: "91234567",
          address: "example address",
          answer: "ans",
        }).save();

        const data = {
          name: "",
          email: "example@gmail.com",
          password: currentPassword,
          newPassword: "",
          address: "",
          phone: "",
        };

        await request(app)
          .put("/api/v1/auth/profile")
          .send(data)
          .set("Authorization", validToken);

        const updatedUser = await userModel.findById(mockUser._id);
        expect(updatedUser).toBeDefined();
        expect(updatedUser.toObject()).toMatchObject(
          expect.objectContaining({
            name: "John Doe",
            email: "example@gmail.com",
            password: hashedCurrentPassword,
            phone: "91234567",
            address: "example address",
            answer: "ans",
          })
        );
      });

      it("should not update profile given invalid current password", async () => {
        const currentPassword = "password";
        const hashedCurrentPassword = await hashPassword(currentPassword);

        await new userModel({
          name: "John Doe",
          email: "example@gmail.com",
          password: hashedCurrentPassword,
          phone: "91234567",
          address: "example address",
          answer: "ans",
        }).save();

        const data = {
          name: "",
          email: "example@gmail.com",
          password: "wrongPassword",
          newPassword: "",
          address: "",
          phone: "",
        };

        const res = await request(app)
          .put("/api/v1/auth/profile")
          .send(data)
          .set("Authorization", validToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty(
          "error",
          "Unauthorized to update. Invalid Email or Password"
        );
      });
    });
  });

  describe("Update Profile Controller Test", () => {
    it("should update profile with valid data", async () => {
      const currentPassword = "password";
      const newPassword = "newPassword";
      const hashedCurrentPassword = await hashPassword(currentPassword);

      const mockUser = await new userModel({
        _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e8"),
        name: "John Doe",
        email: "example@gmail.com",
        password: hashedCurrentPassword,
        phone: "91234567",
        address: "example address",
        answer: "ans",
      }).save();

      const data = {
        name: "Jane Doe",
        email: "example@gmail.com",
        password: currentPassword,
        newPassword: newPassword,
        address: "new address",
        phone: "98765432",
      };

      const res = await request(app)
        .put("/api/v1/auth/profile")
        .send(data)
        .set("Authorization", validToken);

      // Check that user is updated correctly
      const updatedUser = await userModel.findById(mockUser._id);
      expect(updatedUser).toBeDefined();
      const isPasswordCorrect = await comparePassword(
        newPassword,
        updatedUser.password
      );
      expect(isPasswordCorrect).toBe(true);
      expect(updatedUser.toObject()).toMatchObject(
        expect.objectContaining({
          name: "Jane Doe",
          email: "example@gmail.com",
          address: "new address",
          phone: "98765432",
        })
      );

      // Check that res is correct
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toEqual(true);
      expect(res.body.message).toEqual("Profile Updated Successfully");
      expect(res.body.updatedUser).toMatchObject(
        // express automatically converts res.body.updatedUser from a mongoose document to a JSON object when sending a response, so don't need to do .toObject() here
        expect.objectContaining({
          name: "Jane Doe",
          email: "example@gmail.com",
          address: "new address",
          phone: "98765432",
        })
      );
    });

    it("should update only provided fields and retain existing values", async () => {
      const currentPassword = "password";
      const hashedCurrentPassword = await hashPassword(currentPassword);

      const mockUser = await new userModel({
        _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e8"),
        name: "John Doe",
        email: "example@gmail.com",
        password: hashedCurrentPassword,
        phone: "91234567",
        address: "example address",
        answer: "ans",
      }).save();

      const data = {
        name: "Jane Doe",
        email: "example@gmail.com",
        password: currentPassword,
      };

      const res = await request(app)
        .put("/api/v1/auth/profile")
        .send(data)
        .set("Authorization", validToken);

      // Check that only user name is updated
      const updatedUser = await userModel.findById(mockUser._id);
      expect(updatedUser).toBeDefined();
      const isPasswordCorrect = await comparePassword(
        currentPassword,
        updatedUser.password
      );
      expect(isPasswordCorrect).toBe(true);
      expect(updatedUser.toObject()).toMatchObject({
        name: "Jane Doe",
        email: "example@gmail.com",
        address: "example address",
        phone: "91234567",
      });

      // Check that res is correct
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toEqual(true);
      expect(res.body.message).toEqual("Profile Updated Successfully");
      expect(res.body.updatedUser).toMatchObject(
        // express automatically converts res.body.updatedUser from a mongoose document to a JSON object when sending a response, so don't need to do .toObject() here
        {
          name: "Jane Doe",
          email: "example@gmail.com",
          address: "example address",
          phone: "91234567",
        }
      );
    });
  });

  describe("Get Orders Controller Test", () => {
    it("should get all orders of a user successfully", async () => {
      // Save mock data into in-memory db
      const currentPassword = "password";
      const hashedCurrentPassword = await hashPassword(currentPassword);

      const mockCategory = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const mockProducts = [
        {
          name: "product1",
          slug: "product1",
          description: "awesome product 1",
          price: 50,
          category: mockCategory._id,
          quantity: 1,
        },
        {
          name: "product2",
          slug: "product2",
          description: "awesome product 2",
          price: 100,
          category: mockCategory._id,
          quantity: 1,
        },
      ];

      const mockProduct1 = await new productModel(mockProducts[0]).save();
      const mockProduct2 = await new productModel(mockProducts[1]).save();

      const mockUser = await new userModel({
        _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e8"),
        name: "John Doe",
        email: "example@gmail.com",
        password: hashedCurrentPassword,
        phone: "91234567",
        address: "example address",
        answer: "ans",
      }).save();

      const mockOrder1 = await new orderModel({
        products: [mockProduct1._id],
        buyer: mockUser._id,
        status: "Not Process",
      }).save();

      const mockOrder2 = await new orderModel({
        products: [mockProduct2._id],
        buyer: mockUser._id,
        status: "Not Process",
      }).save();

      // Check that orders are stored in the db correctly
      const storedOrders = await orderModel.find({ buyer: mockUser._id });
      expect(storedOrders).toBeDefined();
      expect(storedOrders.length).toBe(2);
      expect(storedOrders[0].toObject()).toMatchObject(mockOrder1.toObject());
      expect(storedOrders[1].toObject()).toMatchObject(mockOrder2.toObject());

      // Execute the controller
      const res = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", validToken);

      // Check that the returned orders are correct
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body[0]._id.toString()).toBe(mockOrder1._id.toString());
      expect(res.body[1]._id.toString()).toBe(mockOrder2._id.toString());
    });
  });

  describe("Get All Orders Controller Test", () => {
    it("should get all orders successfully", async () => {
      // Save mock data into in-memory db
      const currentPassword = "password";
      const hashedCurrentPassword = await hashPassword(currentPassword);

      const mockCategory = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const mockProducts = [
        {
          name: "product1",
          slug: "product1",
          description: "awesome product 1",
          price: 50,
          category: mockCategory._id,
          quantity: 1,
        },
        {
          name: "product2",
          slug: "product2",
          description: "awesome product 2",
          price: 100,
          category: mockCategory._id,
          quantity: 1,
        },
        {
          name: "product3",
          slug: "product3",
          description: "awesome product 3",
          price: 150,
          category: mockCategory._id,
          quantity: 1,
        },
      ];

      const mockProduct1 = await new productModel(mockProducts[0]).save();
      const mockProduct2 = await new productModel(mockProducts[1]).save();
      const mockProudct3 = await new productModel(mockProducts[2]).save();

      const mockUser1 = await new userModel({
        _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e8"),
        name: "John Doe",
        email: "example@gmail.com",
        password: hashedCurrentPassword,
        phone: "91234567",
        address: "example address",
        answer: "ans",
        role: 1, // make mockUser1 an admin so that the getAllOrdersController can be properly accessed
      }).save();

      const mockUser2 = await new userModel({
        _id: new mongoose.Types.ObjectId("671bc2f1364eadc7d5417c80"),
        name: "Thanos",
        email: "thanos@gmail.com",
        password: hashedCurrentPassword,
        phone: "92222222",
        address: "space",
        answer: "ans",
      }).save();

      const mockOrder1 = await new orderModel({
        products: [mockProduct1._id],
        buyer: mockUser1._id,
        status: "Not Process",
      }).save();

      const mockOrder2 = await new orderModel({
        products: [mockProduct2._id],
        buyer: mockUser1._id,
        status: "Not Process",
      }).save();

      const mockOrder3 = await new orderModel({
        products: [mockProudct3._id],
        buyer: mockUser2._id,
        status: "Not Process",
      }).save();

      // Check that all orders (from all buyers) are stored in the db correctly
      const storedOrders = await orderModel.find({});
      expect(storedOrders).toBeDefined();
      expect(storedOrders.length).toBe(3);
      expect(storedOrders[0].toObject()).toMatchObject(mockOrder1.toObject());
      expect(storedOrders[1].toObject()).toMatchObject(mockOrder2.toObject());
      expect(storedOrders[2].toObject()).toMatchObject(mockOrder3.toObject());

      // Execute the controller
      const res = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", validToken);

      // Check that the returned orders are correct (in descending order, as it was sorted by createdAt: -1)
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body[0]._id.toString()).toBe(mockOrder3._id.toString());
      expect(res.body[1]._id.toString()).toBe(mockOrder2._id.toString());
      expect(res.body[2]._id.toString()).toBe(mockOrder1._id.toString());
    });
  });

  describe("Order Status Controller Test", () => {
    it("should modify the order status successfully", async () => {
      // Save mock data into in-memory db
      const currentPassword = "password";
      const hashedCurrentPassword = await hashPassword(currentPassword);

      const mockCategory = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const mockProducts = [
        {
          name: "product1",
          slug: "product1",
          description: "awesome product 1",
          price: 50,
          category: mockCategory._id,
          quantity: 1,
        },
      ];

      const mockProduct = await new productModel(mockProducts[0]).save();

      const mockUser = await new userModel({
        _id: new mongoose.Types.ObjectId("67d0745ec9e0ef3de7eae0e8"),
        name: "John Doe",
        email: "example@gmail.com",
        password: hashedCurrentPassword,
        phone: "91234567",
        address: "example address",
        answer: "ans",
        role: 1, // make mockUser an admin so that the orderStatusController can be properly accessed
      }).save();

      const mockOrder = await new orderModel({
        products: [mockProduct._id],
        buyer: mockUser._id,
        status: "Not Process",
      }).save();

      const data = {
        status: "Processing", // status to be changed into
      };

      // Execute the controller
      const res = await request(app)
        .put(`/api/v1/auth/order-status/${mockOrder._id}`)
        .send(data)
        .set("Authorization", validToken);

      // Check that the order was stored in the db correctly with its updated status
      const storedOrders = await orderModel.find({});
      expect(storedOrders).toBeDefined();
      expect(storedOrders.length).toBe(1);
      expect(storedOrders[0].toObject().status).toBe(data.status);

      // Check that the returned order has its status updated
      expect(res.body).toBeDefined();
      expect(res.body._id.toString()).toBe(mockOrder._id.toString());
      expect(res.body.status).toBe(data.status);
    });
  });
});
