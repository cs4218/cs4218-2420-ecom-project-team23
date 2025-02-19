import { jest } from "@jest/globals";
import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
  updateProfileController,
} from "./authController";
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

    it("should save new user to database and return 201", async () => {
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
        message: "User Registered Successfully",
        user: expectedUser,
      });
    });

    it("should not save user to database and return 400 if existing email", async () => {
      const expectedUser = {
        ...req.body,
        password: expectedHashedPassword,
      };

      userModel.findOne = jest.fn().mockResolvedValue(true);

      await registerController(req, res);

      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel).not.toHaveBeenCalled();
      expect(userModel.prototype.save).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message:
          "Unable to register. If you already have an account, please log in",
      });
    });

    it("should return 500 if error", async () => {
      const expectedError = new Error("error");

      userModel.findOne = jest.fn().mockRejectedValue(expectedError);

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error registering. Please try again later",
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
          "Oops! Please enter a valid phone number in the format: +[country code] [8–12 digits]",
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
        message: "Login successfully",
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

    it("should not login user and return 400 if user not found", async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: expectedUser.email,
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should return 500 if error", async () => {
      const expectedError = new Error("error");

      userModel.findOne = jest.fn().mockRejectedValue(expectedError);

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: req.body.email,
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error logging in. Please try again later",
        error: expectedError,
      });
    });
  });

  describe("Given invalid login details", () => {
    it("should not login user and return 400 if invalid email", async () => {
      req.body.email = "";

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should not login user and return 400 if empty password", async () => {
      req.body.password = "";

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should not login user and return 400 if user does not exist", async () => {
      req.body.email = "nonexistent@gmail.com";

      userModel.findOne = jest.fn().mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should not login user and return 400 if password does not match", async () => {
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

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });
  });
});

describe("Forget Password Controller Test", () => {
  let req, res;

  const expectedUser = {
    _id: "id",
    name: "John Doe",
    email: "example@gmail.com",
    password: "hashedPassword",
    phone: "91234567",
    address: "Example Street",
    role: "user",
    answer: "Example Answer",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        email: expectedUser.email,
        answer: expectedUser.answer,
        newPassword: "newPassword",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("Given valid forget password details", () => {
    const expectedHashedPassword = "hashedPassword";

    it("should update password and return 201", async () => {
      userModel.findOne = jest.fn().mockResolvedValue(expectedUser);
      userModel.findByIdAndUpdate = jest.fn();
      hashPassword.mockResolvedValue(expectedHashedPassword);

      await forgotPasswordController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: expectedUser.email,
        answer: expectedUser.answer,
      });
      expect(hashPassword).toHaveBeenCalledWith(req.body.newPassword);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        expectedUser._id,
        { password: expectedHashedPassword }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });

    it("should not update password and return 400 if user not found", async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);
      userModel.findByIdAndUpdate = jest.fn();
      await forgotPasswordController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: expectedUser.email,
        answer: expectedUser.answer,
      });
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Email Or Answer",
      });
    });

    it("should return 500 if error", async () => {
      const expectedError = new Error("error");

      userModel.findOne = jest.fn().mockRejectedValue(expectedError);

      await forgotPasswordController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: expectedUser.email,
        answer: expectedUser.answer,
      });
      expect(hashPassword).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error resetting password. Please try again later",
        error: expectedError,
      });
    });
  });

  describe("Given invalid forget password details", () => {
    it("should not update password and return 400 if empty email", async () => {
      req.body.email = "";

      await forgotPasswordController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Email is required",
      });
    });

    it("should not update password and return 400 if empty answer", async () => {
      req.body.answer = "";

      await forgotPasswordController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Answer is required",
      });
    });

    it("should not update password and return 400 if empty newPassword", async () => {
      req.body.newPassword = "";

      await forgotPasswordController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "New Password is required",
      });
    });
  });
});

describe("Test Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      send: jest.fn(),
    };
  });

  it("should return 'Protected Routes' if no error", () => {
    testController(req, res);

    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });
});

describe("Update Profile Controller Test", () => {
  const defaultUser = {
    _id: "id",
    name: "John Doe",
    email: "example@gmail.com",
    password: "hashedPassword",
    phone: "91234567",
    address: "Example Street",
  };

  const updatedUserData = {
    name: "Jane Doe",
    password: "hashedNewPassword",
    phone: "9765432",
    address: "Example Street 2",
  };

  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        ...defaultUser,
        ...updatedUserData,
        password: "password",
        newPassword: "newPassword",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  /*
    Approach: Pairwise testing to reduce number of test cases while ensuring every possible
    pair of input values is covered at least once.

    Pairwise Testing with the following inputs:
    name: [Empty, Non-empty]
    email: [Valid, Invalid]
    password: [Valid, Invalid]
    newPassword: [Empty, Non-empty, Invalid]
    phone: [Empty, Non-empty]
    address: [Empty, Non-empty]

    Via Exhaustive Testing: 96 testcases
    Via Pairwise Testing: 11 testcases
  */
  describe("Given Valid Profile Inputs should update profile and return 201", () => {
    it("return 201 given valid email, valid password, empty newPassword, empty name, empty address, non-empty phone", async () => {
      req.body = {
        ...req.body,
        newPassword: "",
        name: "",
        address: "",
      };

      const expectedUpdatedUser = {
        ...defaultUser,
        phone: updatedUserData.phone,
      };

      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue(defaultUser.password);
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...expectedUpdatedUser });

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        defaultUser.password
      );
      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        defaultUser._id,
        {
          name: defaultUser.name,
          password: defaultUser.password,
          phone: updatedUserData.phone,
          address: defaultUser.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expectedUpdatedUser,
      });
    });

    it("return 201 given valid email, valid password, empty newPassword, empty name, non-empty address, empty phone", async () => {
      req.body = {
        ...req.body,
        newPassword: "",
        name: "",
        phone: "",
      };

      const expectedUpdatedUser = {
        ...defaultUser,
        address: updatedUserData.address,
      };

      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue(defaultUser.password);
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...expectedUpdatedUser });

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        defaultUser.password
      );
      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        defaultUser._id,
        {
          name: defaultUser.name,
          password: defaultUser.password,
          phone: defaultUser.phone,
          address: updatedUserData.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expectedUpdatedUser,
      });
    });

    it("return 201 given valid email, valid password, empty newPassword, non-empty name, empty address, non-empty phone", async () => {
      req.body = {
        ...req.body,
        newPassword: "",
        address: "",
      };

      const expectedUpdatedUser = {
        ...defaultUser,
        name: updatedUserData.name,
        phone: updatedUserData.phone,
      };

      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue(defaultUser.password);
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...expectedUpdatedUser });

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        defaultUser.password
      );
      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        defaultUser._id,
        {
          name: updatedUserData.name,
          password: defaultUser.password,
          phone: updatedUserData.phone,
          address: defaultUser.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expectedUpdatedUser,
      });
    });

    it("return 201 given valid email, valid password, empty newPassword, non-empty name, non-empty address, empty phone", async () => {
      req.body = {
        ...req.body,
        newPassword: "",
        phone: "",
      };

      const expectedUpdatedUser = {
        ...defaultUser,
        name: updatedUserData.name,
        address: updatedUserData.address,
      };

      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue(defaultUser.password);
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...expectedUpdatedUser });

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        defaultUser.password
      );
      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        defaultUser._id,
        {
          name: updatedUserData.name,
          password: defaultUser.password,
          phone: defaultUser.phone,
          address: updatedUserData.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expectedUpdatedUser,
      });
    });

    it("return 201 given valid email, valid password, non-empty newPassword, empty name, empty address, non-empty phone", async () => {
      req.body = {
        ...req.body,
        name: "",
        address: "",
      };

      const expectedUpdatedUser = {
        ...defaultUser,
        password: updatedUserData.password,
        phone: updatedUserData.phone,
      };

      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue(updatedUserData.password);

      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...expectedUpdatedUser });

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        defaultUser.password
      );
      expect(hashPassword).toHaveBeenCalledWith(req.body.newPassword);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        defaultUser._id,
        {
          name: defaultUser.name,
          password: updatedUserData.password,
          phone: updatedUserData.phone,
          address: defaultUser.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expectedUpdatedUser,
      });
    });

    it("return 201 given valid email, valid password, non-empty newPassword, empty name, non-empty address, empty phone", async () => {
      req.body = {
        ...req.body,
        name: "",
        phone: "",
      };

      const expectedUpdatedUser = {
        ...defaultUser,
        password: updatedUserData.password,
        address: updatedUserData.address,
      };

      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue(updatedUserData.password);
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...expectedUpdatedUser });

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        defaultUser.password
      );
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        defaultUser._id,
        {
          name: defaultUser.name,
          password: updatedUserData.password,
          phone: defaultUser.phone,
          address: updatedUserData.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expectedUpdatedUser,
      });
    });

    it("return 201 given valid email, valid password, non-empty newPassword, non-empty name, empty address, non-empty phone", async () => {
      req.body = {
        ...req.body,
        address: "",
      };

      const expectedUpdatedUser = {
        ...defaultUser,
        name: updatedUserData.name,
        password: updatedUserData.password,
        phone: updatedUserData.phone,
      };

      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue(updatedUserData.password);
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...expectedUpdatedUser });

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        defaultUser.password
      );
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        defaultUser._id,
        {
          name: updatedUserData.name,
          password: updatedUserData.password,
          phone: updatedUserData.phone,
          address: defaultUser.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expectedUpdatedUser,
      });
    });

    it("return 201 given valid email, valid password, non-empty newPassword, non-empty name, non-empty address, empty phone", async () => {
      req.body = {
        ...req.body,
        phone: "",
      };

      const expectedUpdatedUser = {
        ...defaultUser,
        name: updatedUserData.name,
        password: updatedUserData.password,
        address: updatedUserData.address,
      };

      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue(updatedUserData.password);
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...expectedUpdatedUser });

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(comparePassword).toHaveBeenCalledWith(
        req.body.password,
        defaultUser.password
      );
      expect(hashPassword).toHaveBeenCalledWith(req.body.newPassword);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        defaultUser._id,
        {
          name: updatedUserData.name,
          password: updatedUserData.password,
          phone: defaultUser.phone,
          address: updatedUserData.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expectedUpdatedUser,
      });
    });

    it("return 500 if internal server error", async () => {
      const expectedError = new Error("error");

      userModel.findOne = jest.fn().mockRejectedValue(expectedError);

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while updating profile",
        error: expectedError,
      });
    });
  });

  describe("Given Invalid Profile Inputs", () => {
    it("should return 401 if invalid email", async () => {
      req.body.email = "invalid-email";

      userModel.findOne = jest.fn().mockResolvedValue(null);

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized to update. Invalid Email or Password",
      });
    });

    it("should return 401 if invalid password", async () => {
      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(false);

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: defaultUser.email,
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized to update. Invalid Email or Password",
      });
    });

    it("should return 401 if invalid new password", async () => {
      req.body.newPassword = "new";

      userModel.findOne = jest.fn().mockResolvedValue(defaultUser);
      comparePassword.mockResolvedValue(true);

      await updateProfileController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: defaultUser.email,
      });
      expect(comparePassword).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Password should be at least 6 character long",
      });
    });
  });
});
