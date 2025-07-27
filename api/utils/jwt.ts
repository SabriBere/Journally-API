import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET! as string;

//3600 = 1h
export function generateToken(payload: object, expiresIn = 3600) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function generateRefreshToken(payload: object, expiresIn = 36000) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

//implementar un refreshToken

export function verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
}
