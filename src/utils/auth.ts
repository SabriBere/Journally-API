import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET! as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET! as string;

if (
    !JWT_SECRET ||
    !JWT_REFRESH_SECRET ||
    JWT_SECRET.length < 32 ||
    JWT_REFRESH_SECRET.length < 32
) {
    throw new Error(
        "JWT_SECRET y JWT_REFRESH_SECRET deben existir y tener al menos 32 caracteres."
    );
}

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export function generateToken(
    payload: object,
    expiresIn = ACCESS_TOKEN_TTL_SECONDS
) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function generateRefreshToken(
    payload: object,
    expiresIn = REFRESH_TOKEN_TTL_SECONDS
) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn,
        jwtid: randomUUID(),
    });
}
