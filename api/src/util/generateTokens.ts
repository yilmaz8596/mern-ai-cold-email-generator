import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!;

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const REFRESH_TOKEN_TTL = "7d";

interface TokenPayload {
  userId: string;
  email: string;
}

export const generateTokens = async (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

  await redisClient?.setEx(
    `refresh:${payload.userId}`,
    REFRESH_TOKEN_TTL_SECONDS,
    refreshToken,
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
};
