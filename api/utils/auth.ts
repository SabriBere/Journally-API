import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET! as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET! as string;

//15m 15 * 60 --> para desarrollo lo voy a extender
export function generateToken(payload: object, expiresIn = 7 * 24 * 60 * 60) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

//7 días
export function generateRefreshToken(
    payload: object,
    expiresIn = 7 * 24 * 60 * 60
) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
}
