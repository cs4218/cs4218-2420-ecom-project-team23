import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import UserModel from "./userModel";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await UserModel.deleteMany();
  jest.clearAllMocks();
});

describe("User Model", () => {
  const userData = {
    name: "John Doe",
    email: "john_doe@test.com",
    password: "password",
    phone: "1234567890",
    address: {
      test: "test",
    },
    answer: "answer",
  };

  test("should be invalid if required fields are empty", async () => {
    const errorUserData = { role: 0 };

    const user = new UserModel(errorUserData);
    try {
      await user.save();
    } catch (error) {
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
      expect(error.errors.phone).toBeDefined();
      expect(error.errors.address).toBeDefined();
      expect(error.errors.answer).toBeDefined();

      expect(error.errors.name.message).toEqual("Path `name` is required.");
      expect(error.errors.email.message).toEqual("Path `email` is required.");
      expect(error.errors.password.message).toEqual(
        "Path `password` is required."
      );
      expect(error.errors.phone.message).toEqual("Path `phone` is required.");
      expect(error.errors.address.message).toEqual(
        "Path `address` is required."
      );
      expect(error.errors.answer.message).toEqual("Path `answer` is required.");
    }
  });

  test("should be valid if required fields are present", async () => {
    const user = new UserModel(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toEqual(userData.name);
    expect(savedUser.email).toEqual(userData.email);
    expect(savedUser.password).toEqual(userData.password);
    expect(savedUser.phone).toEqual(userData.phone);
    expect(savedUser.address).toEqual(userData.address);
    expect(savedUser.answer).toEqual(userData.answer);
    expect(savedUser.role).toEqual(0);
  });

  test("name should be trimmed", async () => {
    userData.name = "  John Doe  ";

    const user = new UserModel(userData);
    const savedUser = await user.save();

    expect(savedUser.name).toEqual("John Doe");
  });

  test("role should be able to be set to 1", async () => {
    userData.role = 1;
    const user = new UserModel(userData);

    const savedUser = await user.save();

    expect(savedUser.role).toEqual(1);
  });

  test("test for uniqueness of email", async () => {
    const user1 = new UserModel(userData);
    await user1.save();

    const user2 = new UserModel(userData);

    
    await expect(user2.save()).rejects.toThrow("duplicate");
  });
});
