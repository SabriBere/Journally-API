import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const accessToken = req.headers["x-access-token"] as string;
        const refreshToken = req.headers["x-refresh-token"] as string;

        //si no hay un token proporcionado
        if (!accessToken) {
            return res
                .status(401)
                .json({ error: true, data: "Token no proporcionado" });
        }

        if (!refreshToken) {
            return res
                .status(401)
                .json({ error: true, data: "Refresh no proporcionado" });
        }

        //modificar logica para access y refresh
        const decodedAccess = jwt.verify(accessToken!, JWT_SECRET);
        // const decodedRefresh = jwt.verify(refreshToken!, JWT_SECRET);

        (req as any).user = decodedAccess;
        // console.log((req as any).user, 'middleware')
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ error: true, data: "Token inválido o expirado" });
    }
}
