import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        //si no hay un token proporcionado
        if (!token) {
            return res
                .status(401)
                .json({ error: true, data: "Token no proporcionado" });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        // console.log((req as any).user, 'middleware')
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ error: true, data: "Token inválido o expirado" });
    }
}
