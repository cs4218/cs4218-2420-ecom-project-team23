import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

describe("Auth Helper Test", () => {
  const saltRounds = 10;
  const password = "password";

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should hash password correctly", async () => {
    const expectedHashedPassword = "hashedPassword";

    const hashSpy = jest
      .spyOn(bcrypt, "hash")
      .mockResolvedValue(expectedHashedPassword);

    const hashedPassword = await hashPassword(password);

    expect(hashSpy).toHaveBeenCalledWith(password, saltRounds);
    expect(hashedPassword).toBe(expectedHashedPassword);
  });

  it("should return error when hashing password fails", async () => {
    const error = new Error("error");

    jest.spyOn(bcrypt, "hash").mockRejectedValue(error);

    const consoleSpy = jest.spyOn(console, "log");

    await hashPassword(password);

    expect(consoleSpy).toHaveBeenCalledWith(error);
  });

  it("should compare password correctly", async () => {
    const hashedPassword = "hashedPassword";

    const compareSpy = jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const result = await comparePassword(password, hashedPassword);

    expect(compareSpy).toHaveBeenCalledWith(password, hashedPassword);
    expect(result).toBe(true);
  });

  it("should return false if compare password is wrong", async () => {
    const wrongHashedPassword = "wrongHashedPassword";

    jest.spyOn(bcrypt, "compare");

    const result = await comparePassword(password, wrongHashedPassword);

    expect(result).toBe(false);
  });
});
