import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import userModel from "../models/userModel";
import {
  registerController,
  loginController,
  forgotPasswordController,
  updateProfileController,
} from "./authController";
import { hashPassword, comparePassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("Controller Tests", () => {
  let mongoServer, res;

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
    await userModel.deleteMany();

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

      await registerController({ body: userData }, res);

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

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "User Registered Successfully",
        user: expect.objectContaining({
          _id: savedUser._id,
          name: userData.name,
          email: userData.email,
          password: savedUser.password,
          address: userData.address,
          answer: userData.answer,
          phone: userData.phone,
          role: 0,
          createdAt: savedUser.createdAt,
          updatedAt: savedUser.updatedAt,
        }),
      });
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

      await registerController({ body: userData }, res);

      // Check that new User is not saved due to existing email
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message:
          "Unable to register. If you already have an account, please log in",
      });
    });
  });

  describe("Login Controller Test", () => {
    it("should login existing user successfully given valid credentials", async () => {
      JWT.sign.mockReturnValue("validToken");

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

      await loginController({ body: loginData }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Login successfully",
        token: "validToken",
        user: {
          _id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          phone: savedUser.phone,
          address: savedUser.address,
          role: savedUser.role,
        },
      });
    });

    it("should not login user if email is not registered", async () => {
      const loginData = {
        email: "example@gmail.com",
        password: "password",
      };

      await loginController({ body: loginData }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
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

      const savedUser = await mockUser.save();

      // Login with valid credentials
      const loginData = {
        email: "example@gmail.com",
        password: "wrongPassword",
      };

      await loginController({ body: loginData }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
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

      await forgotPasswordController({ body: userData }, res);

      const updatedUser = await userModel.findById(savedUser._id);
      await expect(
        comparePassword(userData.newPassword, updatedUser.password)
      ).resolves.toBe(true);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });

    it("should not reset password with invalid answer", async () => {
      const mockUser = await new userModel({
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

      await forgotPasswordController({ body: userData }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Email Or Answer",
      });
    });

    it("should not reset password if user does not exist", async () => {
      const userData = {
        email: "example@gmail.com",
        answer: "ans",
        newPassword: "newPassword",
      };

      await forgotPasswordController({ body: userData }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Email Or Answer",
      });
    });
  });

  describe("Update Profile Controller Test", () => {
    it("should update profile successfully given valid credentials", async () => {
      const currentPassword = "password";
      const newPassword = "newPassword";
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
        name: "Jane Doe",
        email: "example@gmail.com",
        password: currentPassword,
        newPassword: newPassword,
        address: "new address",
        phone: "98765432",
      };

      await updateProfileController({ body: data }, res);

      const updatedUser = await userModel.findById(mockUser._id);
      expect(updatedUser).toBeDefined();
      expect(comparePassword(newPassword, updatedUser.password)).resolves.toBe(
        true
      );
      expect(updatedUser.toObject()).toMatchObject(
        expect.objectContaining({
          name: "Jane Doe",
          email: "example@gmail.com",
          address: "new address",
          phone: "98765432",
        })
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

      await updateProfileController({ body: data }, res);

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

      await updateProfileController({ body: data }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized to update. Invalid Email or Password",
      });
    });
  });
});
