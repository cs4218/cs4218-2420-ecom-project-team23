import mongoose from "mongoose";
import connectDB from "./db";

jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

jest.mock("colors");

describe("connectDB", () => {
  let consoleSpy;
  let testURL = "mongodb+srv://send:cookies@localhost:27017/ilovecs4218"

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
    process.env.MONGO_URL = testURL;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.env.MONGO_URL = "";
  });

  test("should connect to the database", async () => {
    mongoose.connect.mockResolvedValueOnce({
      connection: { host: "localhost" },
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(testURL);
    expect(consoleSpy).toHaveBeenCalledWith("Connected To Mongodb Database localhost".bgMagenta.white);
  });

  test("failed connection, should throw an error", async () => {
    mongoose.connect.mockRejectedValueOnce("Failed Connection");

    await connectDB();

    expect(consoleSpy).toHaveBeenCalledWith("Error in Mongodb Failed Connection".bgRed.white);
  });
});
