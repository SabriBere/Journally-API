import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET! as string;

export function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        //cada vez que se refresca, enviar 2 pares nuevos
        const accessToken = req.headers["x-access-token"] as string;

        //si no hay un token proporcionado
        if (!accessToken) {
            return res
                .status(401)
                .json({ error: true, data: "Token no proporcionado" });
        }

        //modificar logica para access y refresh
        const decodedAccess = jwt.verify(accessToken!, JWT_SECRET);

        (req as any).user = decodedAccess;
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ error: true, data: "Token inválido o expirado" });
    }
}

export function authenticateRefresh(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const refreshToken = req.headers["x-refresh-token"] as string;

        if (!refreshToken) {
            return res
                .status(401)
                .json({ error: true, data: "Refresh no proporcionado" });
        }

        const decodedRefresh = jwt.verify(refreshToken!, JWT_REFRESH_SECRET);

        (req as any).user = decodedRefresh;

        next();
    } catch (error) {
        return res
            .status(401)
            .json({ error: true, data: "Token refresh invalido o expirado" });
    }
}
