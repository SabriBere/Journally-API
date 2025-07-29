import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET! as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET! as string;

//3600 = 1h
export function generateToken(payload: object, expiresIn = 3600) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

//10800 7 días
export function generateRefreshToken(payload: object, expiresIn = 7 * 24 * 60 * 60 ) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
}
