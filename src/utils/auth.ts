import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET! as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET! as string;

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
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
}
