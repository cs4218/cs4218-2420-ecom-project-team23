import { jest } from "@jest/globals";
import { registerController, loginController } from "./authController";
import userModel from "../models/userModel";
import { hashPassword, comparePassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel");
jest.mock("../helpers/authHelper");
jest.mock("jsonwebtoken");

describe("Register Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        name: "John Doe",
        email: "example@gmail.com",
        password: "password",
        phone: "91234567",
        address: "Example Street",
        answer: "Example Answer",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("Given valid registration details", () => {
    const expectedHashedPassword = "hashedPassword";

    it("should save new user to database", async () => {
      const expectedUser = {
        ...req.body,
        password: expectedHashedPassword,
      };

      userModel.findOne = jest.fn().mockResolvedValue(false);
      userModel.prototype.save = jest.fn().mockResolvedValue(expectedUser);
      hashPassword.mockResolvedValue(expectedHashedPassword);

      await registerController(req, res);

      expect(hashPassword).toHaveBeenCalledWith(req.body.password);
      expect(userModel).toHaveBeenCalledWith(expectedUser);
      expect(userModel.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "User Register Successfully",
        user: expectedUser,
      });
    });

    it("should not save user to database if existing email", async () => {
      const expectedUser = {
        ...req.body,
        password: expectedHashedPassword,
      };

      userModel.findOne = jest.fn().mockResolvedValue(true);

      await registerController(req, res);

      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Register please login",
      });
    });

    it("should not save user if error", async () => {
      const expectedError = new Error("error");

      userModel.findOne = jest.fn().mockResolvedValue(false);
      userModel.prototype.save = jest.fn().mockResolvedValue();
      hashPassword.mockRejectedValue(expectedError);

      await registerController(req, res);

      expect(hashPassword).toHaveBeenCalledWith(req.body.password);
      expect(userModel.prototype.save).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in Registeration",
        error: expectedError,
      });
    });
  });

  describe("Given invalid registration details", () => {
    it("should not save new user if empty name", async () => {
      req.body.name = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty email", async () => {
      req.body.email = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if invalid email format", async () => {
      req.body.email = "invalid-email";

      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({
        message: "Invalid Email Format (hint: example@gmail.com)",
      });
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty password", async () => {
      req.body.password = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Password is Required",
      });
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty phone no", async () => {
      req.body.phone = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Phone no is Required",
      });
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if invalid phone no", async () => {
      req.body.phone = "helloworld";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message:
          "Oops! Please enter a valid phone number in the format: +[country code] [8–12 digits].",
      });
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty address", async () => {
      req.body.address = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Address is Required",
      });
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty answer", async () => {
      req.body.answer = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Answer is Required",
      });
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });
  });
});

describe("Login Controller Test", () => {
  let req, res;

  const expectedUser = {
    _id: "id",
    name: "John Doe",
    email: "example@gmail.com",
    password: "hashedPassword",
    phone: "91234567",
    address: "Example Street",
    role: "user",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        email: expectedUser.email,
        password: "password",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("Given valid login details", () => {
    const expectedToken = "token";

    it("should login user and return 200 and a token", async () => {
      userModel.findOne = jest.fn().mockResolvedValue(expectedUser);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockResolvedValue(expectedToken);

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: expectedUser.email,
      });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        expectedUser.password
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "login successfully",
        user: {
          _id: expectedUser._id,
          name: expectedUser.name,
          email: expectedUser.email,
          phone: expectedUser.phone,
          address: expectedUser.address,
          role: expectedUser.role,
        },
        token: expectedToken,
      });
    });

    it("should not login user and return 404 if user not found", async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: expectedUser.email,
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registerd",
      });
    });

    it("should not login user and return 500 if error", async () => {
      const expectedError = new Error("error");

      userModel.findOne = jest.fn().mockRejectedValue(expectedError);

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: req.body.email,
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in login",
        error: expectedError,
      });
    });
  });

  describe("Given invalid login details", () => {
    it("should not login user and return 404 if invalid email", async () => {
      req.body.email = "";

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should not login user and return 404 if empty password", async () => {
      req.body.password = "";

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should not login user and return 404 if user does not exist", async () => {
      req.body.email = "nonexistent@gmail.com";

      userModel.findOne = jest.fn().mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registerd",
      });
    });

    it("should not login user and return 200 if password does not match", async () => {
      userModel.findOne = jest.fn().mockResolvedValue(expectedUser);
      comparePassword.mockResolvedValue(false);

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: expectedUser.email,
      });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        expectedUser.password
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
    });
  });
});
