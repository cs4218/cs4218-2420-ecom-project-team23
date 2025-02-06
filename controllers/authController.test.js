import { jest } from "@jest/globals";
import { registerController } from "./authController";
import userModel from "../models/userModel";
import { hashPassword } from "../helpers/authHelper";
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");

describe("Register Controller Test", () => {
  let req, res;

  describe("Given valid registration details", () => {
    const password = "password";
    const expectedHashedPassword = "hashedPassword";

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        body: {
          name: "John Doe",
          email: "example@gmail.com",
          password: password,
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
    });

    it("should not save new user if empty name", async () => {
      req.body.name = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty email", async () => {
      req.body.email = "";

      // specify mock functionality
      userModel.findOne = jest.fn().mockResolvedValue(null);
      userModel.prototype.save = jest.fn();

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if invalid email format", async () => {
      req.body.email = "invalid-email";

      // specify mock functionality
      userModel.findOne = jest.fn().mockResolvedValue(null);
      userModel.prototype.save = jest.fn();

      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({
        message: "Invalid Email Format (hint: example@gmail.com)",
      });
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty password", async () => {
      req.body.password = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Password is Required",
      });
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty phone no", async () => {
      req.body.phone = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Phone no is Required",
      });
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if invalid phone no", async () => {
      req.body.phone = "helloworld";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message:
          "Oops! Please enter a valid phone number in the format: +[country code] [8–12 digits].",
      });
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty address", async () => {
      req.body.address = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Address is Required",
      });
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });

    it("should not save new user if empty answer", async () => {
      req.body.answer = "";

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Answer is Required",
      });
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    });
  });
});
