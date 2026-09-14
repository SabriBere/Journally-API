import { Request, Response } from "express";
import { validationResult } from "express-validator";
import UserService from "../services/usersServices";
import observabilityLogger from "../loggers/observabilityLogger";

class UserControllers {
    static async create(req: Request, res: Response) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, data: errors.array() });
        }

        const data = await UserService.createUser(req.body);
        res.status(200).json({ data });
    }

    static async login(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, data: errors.array() });
        }
        const data = await UserService.getUser(req.body);

        const { accessToken, refreshToken, ...userData } = data;
        res.header("x-access-token", accessToken);
        res.header("x-refresh-token", refreshToken);

        return res.status(201).json({ data: userData });
    }

    static async refreshToken(req: Request, res: Response) {
        const data = await UserService.verifyRefreshToken(req);
        const { newAccessToken, newRefreshToken, ...user } = data;

        res.header("x-access-token", newAccessToken);
        res.header("x-refresh-token", newRefreshToken);

        return res.status(201).json({ data: user });
    }

    static async logout(req: Request, res: Response) {
        const revokedSessions = await UserService.revokeRefreshToken(
            (req as any).refreshToken
        );

        if (revokedSessions.count > 0) {
            observabilityLogger.info("user_session_revoked", {
                userId: (req as any).user?.userId,
                operation: "logout",
                status: "completed",
                count: revokedSessions.count,
            });
        }

        return res.status(204).send();
    }

    static async deleteUser(req: Request, res: Response) {
        const id = (req as any).user?.userId;
        await UserService.eraserUser(id);
        res.status(204).send();
    }
}

export default UserControllers;
