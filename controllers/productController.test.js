import braintree, { Environment } from "braintree";
import orderModel from "../models/orderModel";
import {
  braintreeTokenController,
  brainTreePaymentController,
} from "./productController";

// Required to mock this way because we cannot use .prototype due to the fact that there is chaining in the form of clientToken.generate
jest.mock("braintree", () => {
  const mockGenerate = jest.fn();
  const mockSale = jest.fn();
  return {
    BraintreeGateway: jest.fn(() => ({
      clientToken: {
        generate: mockGenerate,
      },
      transaction: {
        sale: mockSale,
      },
    })),
    Environment: {
      Sandbox: "sandbox",
    },
    __mockGenerate: mockGenerate, // required to used in tests later on
    __mockSale: mockSale, // required to used in tests later on
  };
});

jest.mock("../models/orderModel.js");

describe("Payment Controllers", () => {
  describe("BrainTree Token Controller Test", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = null;

      res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
    });

    it("should generate and send back client token successfully", async () => {
      const mockResponse = { clientToken: "token123" };
      braintree.__mockGenerate.mockImplementation((_, functionToBeCalled) => {
        functionToBeCalled(null, mockResponse); // null because we do not want any err
      });

      await braintreeTokenController(req, res);

      expect(res.send).toHaveBeenCalledWith(mockResponse);
    });

    it("should handle errors and return status 500", async () => {
      const mockError = new Error("Braintree error");
      braintree.__mockGenerate.mockImplementation((_, functionToBeCalled) => {
        functionToBeCalled(mockError, null); // null because there is an err
      });

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
    });
  });

  describe("BrainTree Payment Controller Test", () => {
    let req, res;
    const mockUserId = "user123";
    const mockCart = [
      { _id: "product1", name: "Infinity Gaunlet", price: 50 },
      { _id: "product2", name: "Chair", price: 10 },
      { _id: "product3", name: "Table", price: 30 },
    ];

    beforeEach(() => {
      jest.clearAllMocks();

      req = {
        user: {
          _id: mockUserId,
        },
        body: {
          nonce: "payment method 1",
          cart: mockCart,
        },
      };

      res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should pay successfully", async () => {
      const mockResult = { success: true };
      braintree.__mockSale.mockImplementation((_, functionToBeCalled) => {
        functionToBeCalled(null, mockResult); // null because we do not want err
      });
      orderModel.prototype.save = jest.fn();

      await brainTreePaymentController(req, res);

      expect(orderModel.prototype.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it("should handle errors and return status 500", async () => {
      const mockError = new Error("Braintree error");
      braintree.__mockSale.mockImplementation((_, functionToBeCalled) => {
        functionToBeCalled(mockError, null); // null because there is an err
      });

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
    });
  });
});
