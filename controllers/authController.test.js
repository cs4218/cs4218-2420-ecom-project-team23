import { jest } from "@jest/globals";
import { registerController } from "./authController";
import userModel from "../models/userModel";

jest.mock("../models/userModel.js");

describe("Register Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        name: "John Doe",
        email: "invalidemail.com", // Email without "@"
        password: "password123",
        phone: "1234567890",
        address: "123 Test Street",
        answer: "Test Answer",
      },
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it("should return an error if email format is incorrect", async () => {
    // specify mock functionality
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });
});
