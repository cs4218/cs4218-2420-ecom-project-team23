import { jest } from "@jest/globals";
<<<<<<< HEAD
import {
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "./authController";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";
import { hashPassword } from "../helpers/authHelper";

jest.mock("../models/userModel.js");

jest.mock("../models/orderModel.js")

jest.mock("../helpers/authHelper.js");

describe("Update Profile Controller Test", () => {
=======
import { registerController } from "./authController";
import userModel from "../models/userModel";

jest.mock("../models/userModel.js");

describe("Register Controller Test", () => {
>>>>>>> main
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

<<<<<<< HEAD
    jest.spyOn(console, "log").mockImplementation(() => {}); // to prevent logging during testing

    req = {
      user: {
        _id: "user123",
      },
      body: {
        name: "John Doe",
        password: "password123",
        address: "New Address",
        phone: "91234567",
=======
    req = {
      body: {
        name: "John Doe",
        email: "invalidemail.com", // Email without "@"
        password: "password123",
        phone: "1234567890",
        address: "123 Test Street",
        answer: "Test Answer",
>>>>>>> main
      },
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
<<<<<<< HEAD
      json: jest.fn(),
    };
  });

  it("should update profile with valid data", async () => {
    userModel.findById = jest.fn().mockResolvedValue({
      _id: "user123",
      name: "Old Name",
      password: "oldhashedpassword",
      address: "Old Address",
      phone: "97654321",
    });
    hashPassword.mockResolvedValue("newhashedpassword");
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: "user123",
      name: "John Doe",
      password: "newhashedpassword",
      address: "New Address",
      phone: "91234567",
    });

    await updateProfileController(req, res);

    expect(userModel.findById).toHaveBeenCalledWith("user123");
    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: "John Doe",
        password: "newhashedpassword",
        address: "New Address",
        phone: "91234567",
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile updated successfully",
      updatedUser: expect.any(Object),
    });
  });

  it("should return an error if password is shorter than 6 characters", async () => {
    req.body.password = "123"; // Invalid password

    await updateProfileController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      error: "Passsword is required and 6 character long",
    });
  });

  it("should update only provided fields and retain existing values", async () => {
    req.body = { name: "Updated Name" }; // Only name is updated

    userModel.findById = jest.fn().mockResolvedValue({
      _id: "user123",
      name: "Old Name",
      password: "oldhashedpassword",
      address: "Old Address",
      phone: "97654321",
    });
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: "user123",
      name: "Updated Name",
      password: "oldhashedpassword",
      address: "Old Address",
      phone: "97654321",
    });

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: "Updated Name",
        password: "oldhashedpassword",
        phone: "97654321",
        address: "Old Address",
      },
      { new: true }
    );
  });

  it("should handle errors gracefully", async () => {
    userModel.findById.mockRejectedValue(new Error("Database error"));

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while updating profile",
      error: expect.any(Error),
    });
  });
});

describe("Get Orders Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, "log").mockImplementation(() => {}); // to prevent logging during testing

    req = {
      user: {
        _id: "user123",
      },
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return orders successfully", async () => {
    const mockOrders = [
      {
        _id: "order1",
        products: [
          {
            _id: "product1",
            name: "product 1",
            price: "price 1",
            description: "descrption 1",
          },
        ],
        buyer: { name: "John Doe" },
      },
    ];
    const mockPopulate2 = jest.fn().mockResolvedValue(mockOrders);
    const mockPopulate1 = jest
      .fn()
      .mockReturnValue({ populate: mockPopulate2 });
    orderModel.find = jest.fn().mockReturnValue({
      populate: mockPopulate1,
    });

    await getOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
    expect(mockPopulate1).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulate2).toHaveBeenCalledWith("buyer", "name");
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should handle errors and return status 500", async () => {
    const mockError = new Error("Database error");
    orderModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(mockError),
      }),
    });

    await getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting orders",
      error: mockError,
    });
  });
});

describe("Get All Orders Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, "log").mockImplementation(() => {}); // to prevent logging during testing

    req = null;

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return all orders successfully, sorted in descending order of createdAt", async () => {
    const mockOrders = [
      {
        _id: "order1",
        products: [
          {
            _id: "product1",
            name: "product 1",
            price: "price 1",
            description: "descrption 1",
          },
        ],
        buyer: { name: "John Doe" },
        createdAt: "2024-01-10T12:00:00Z",
      },
      {
        _id: "order2",
        products: [
          {
            _id: "product2",
            name: "product 2",
            price: "price 2",
            description: "descrption 2",
          },
        ],
        buyer: { name: "Alice Wong" },
        createdAt: "2024-01-11T12:00:00Z",
      },
    ];
    const mockSort = jest.fn().mockResolvedValue(mockOrders);
    const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort });
    const mockPopulate1 = jest
      .fn()
      .mockReturnValue({ populate: mockPopulate2 });
    orderModel.find = jest.fn().mockReturnValue({ populate: mockPopulate1 });

    await getAllOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(mockPopulate1).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulate2).toHaveBeenCalledWith("buyer", "name");
    expect(mockSort).toHaveBeenCalledWith({ createdAt: "-1" });
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should handle errors and return status 500", async () => {
    const mockError = new Error("Database error");
    orderModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(mockError),
        }),
      }),
    });

    await getAllOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting orders",
      error: mockError,
    });
  });
});

describe("Order Status Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, "log").mockImplementation(() => {}); // to prevent logging during testing

    req = {
      params: {
        orderId: "order1",
      },
      body: {
        status: "Shipped",
      },
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return an order with its status successfully", async () => {
    const mockOrder = { _id: "order1", status: "Shipped" };
    orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockOrder);

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order1",
      { status: "Shipped" },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  });

  it("should handle errors and return status 500", async () => {
    const mockError = new Error("Database error");
    orderModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while updating order",
      error: mockError,
    });
=======
    };
  });

  it("should return an error if email format is incorrect", async () => {
    // specify mock functionality
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
>>>>>>> main
  });
});
