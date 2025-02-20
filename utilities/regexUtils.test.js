import { emailRegex } from "./regexUtils";
import { phoneRegex } from "./regexUtils";

describe("Regex Utils", () => {
  describe("Given valid details", () => {
    it("emailRegex should only pass", () => {
      // Boundary Value Analysis
      const validBoundaryEmails = [
        "a@b.co", // Min Username, Domain Name and TLD length
        "a@b.com.edu.sg", // Max TLD length
      ];

      for (const email of validBoundaryEmails) {
        expect(emailRegex.test(email)).toBe(true);
      }

      // Equivalence Paritioning
      const validEmails = [
        "E-x_a.mple09.@gmail.com",
        "example@Gm0-9il.com.sg",
        "example@gmail.NuZ..du",
      ];

      for (const email of validEmails) {
        expect(emailRegex.test(email)).toBe(true);
      }

      // Equivalence Partitioning
    });

    it("phoneRegex should only pass valid phone number", () => {
      // Boundary Value Analysis
      const validBoundaryPhoneNumbers = [
        "91234567", // No Country Code Min Phone Length
        "901234567891", // No Country Code Max Phone Length
        "6 91234567", // Min Country Code Min Phone Length (without +)
        "6565 912345678912", // Max Country Code Max Phone Length (without +)
        "+6 91234567", // Min Country Code Min Phone Length (with +)
        "+6565 912345678912", // Max Country Code Max Phone Length (with +)
      ];

      for (const phoneNo of validBoundaryPhoneNumbers) {
        expect(phoneRegex.test(phoneNo)).toBe(true);
      }

      // Equivalence Partitioning
      const validPhoneNumbers = [
        "0123456789",
        "65 0123456789",
        "+656 0123456789",
      ];

      for (const phoneNo of validPhoneNumbers) {
        expect(phoneRegex.test(phoneNo)).toBe(true);
      }
    });
  });

  describe("Given invalid details", () => {
    it("emailRegex should fail", () => {
      // Equivalence Partitioning
      const invalidEmails = [
        "", // Empty
        " ", // Whitespace
        "@b.com", // No Username
        "a@.com", // No Domain Name
        "a@b", // No TLD
        "*@b.com", // Invalid Username
        "a@*.com", // Invalid Domain Name
        "a@b.c_m", // Invalid TLD
        "a@b.c", // Invalid TLD length (Min TLD length - 1)
        "a@b.nus.edu.sgs", // Invalid TLD length (Max TLD length + 1)
      ];

      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    it("phoneRegex should fail", () => {
      // Equivalence Partitioning
      const invalidPhoneNumbers = [
        "", // Empty
        " ", // Whitespace
        " 91234567", // Starting with Whitespace
        "helloworld", // Invalid Characters
        "+659123456", // No Space between Phone Number and Country Code
        "65  91234567", // Extra Space between Phone Number and Country Code
        "+ 91234567", // Country Code with Invalid Length (min length - 1)
        "+65656 91234567", // Country Code with Invalid Length (max length + 1)
        "65 9123456", // Country Code Invalid Phone Length (max length - 1)
        "65 9123456789123", // Country Code Invalid Phone Length (max length + 1)
      ];

      for (const phoneNo of invalidPhoneNumbers) {
        expect(emailRegex.test(phoneNo)).toBe(false);
      }
    });
  });
});
