import JWT from "jsonwebtoken";
import { requireSignIn, isAdmin } from "./authMiddleware";
import userModel from "../models/userModel";

jest.mock("../models/userModel");
jest.mock("jsonwebtoken");

describe("Require SignIn Middleware Test", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {
        authorization: "ValidToken",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  it("should call next if there is no error", async () => {
    const expectedUser = "decodedUser";
    JWT.verify.mockReturnValue(expectedUser);

    await requireSignIn(req, res, next);

    expect(JWT.verify).toHaveBeenCalledWith(
      "ValidToken",
      process.env.JWT_SECRET
    );
    expect(req.user).toBe(expectedUser);
    expect(next).toHaveBeenCalled();
  });

  it("should handle JWT verification error and call next with an error", async () => {
    req.headers.authorization = "invalidToken";
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const expectedError = new Error("Invalid Token");

    JWT.verify.mockImplementationOnce((auth, jwt_secret) => {
      throw expectedError;
    });

    await requireSignIn(req, res, next);

    expect(JWT.verify).toHaveBeenCalledWith(
      "invalidToken",
      process.env.JWT_SECRET
    );
    expect(consoleSpy).toHaveBeenCalledWith(expectedError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: expectedError,
      message: expectedError.message,
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("Is Admin Middleware Test", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: "userId",
        role: 1, // 1 = admin, 0 = user
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    next = jest.fn();
  });

  it("should call next if user is admin", async () => {
    userModel.findById.mockResolvedValue(req.user);

    await isAdmin(req, res, next);

    expect(userModel.findById).toHaveBeenCalledWith(req.user._id);
    expect(next).toHaveBeenCalled();
  });

  it("should return 401 if user not admin", async () => {
    req.user.role = 0;

    userModel.findById.mockResolvedValue(req.user._id);

    await isAdmin(req, res, next);

    expect(userModel.findById).toHaveBeenCalledWith("userId");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized Access",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should log error and return 500 if internal server error", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const expectedError = new Error("Admin Middleware Error");

    userModel.findById.mockRejectedValue(expectedError);

    await isAdmin(req, res, next);

    expect(userModel.findById).toHaveBeenCalledWith(req.user._id);
    expect(next).not.toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledWith(expectedError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: expectedError,
      message: "Error in admin middleware",
    });
  });
});
