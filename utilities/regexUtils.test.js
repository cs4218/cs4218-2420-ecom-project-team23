import { emailRegex } from "./regexUtils";
import { phoneRegex } from "./regexUtils";

describe("Regex Utils", () => {
  it("emailRegex should only pass valid emails", () => {
    const validEmails = [
      "example@gmail.com",
      "example@gmail.com.sg",
      "example@gmail.nus.edu",
      "example@gmail.nus.edu.sg",
      "example123@yahoo.com",
      "example@hotmail.sg",
    ];

    for (const email of validEmails) {
      expect(emailRegex.test(email)).toBe(true);
    }

    const invalidEmails = [
      "",
      " ",
      "invalidemail",
      "example@gmail",
      "examplegmail.com",
      "example@gmail.",
      "@gmail.c",
      "example@gmail.c",
    ];

    for (const email of invalidEmails) {
      console.log(email);
      expect(emailRegex.test(email)).toBe(false);
    }
  });

  it("phoneRegex should only pass valid phone number", () => {
    const validPhoneNumbers = [
      "91234567",
      "912345678912",
      "65 91234567",
      "65 912345678912",
      "+65 91234567",
      "+6565 912345678912",
    ];

    for (const phone of validPhoneNumbers) {
      expect(phoneRegex.test(phone)).toBe(true);
    }

    const invalidPhoneNumbers = [
      "",
      " ",
      "helloworld",
      "+ 91234567",
      "+65656 91234567",
      "+65 9123456789123",
    ];

    for (const phone of invalidPhoneNumbers) {
      expect(phoneRegex.test(phone)).toBe(false);
    }
  });
});
