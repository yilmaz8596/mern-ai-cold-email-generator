import { randomInt } from "crypto";

export const generateOtp = (length = 6): string => {
  if (length <= 0) return "";
  const max = 10 ** length;
  const n = randomInt(0, max); // cryptographically secure
  return n.toString().padStart(length, "0");
};
