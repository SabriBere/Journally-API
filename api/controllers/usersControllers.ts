import { Request, Response } from "express";
import { validationResult } from "express-validator";
import UserService from "../services/usersServices";

class UserControllers {
    static async create(req: Request, res: Response) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, data: errors.array() });
        }

        const { status, error, data } = await UserService.createUser(req.body);
        if (error) {
            if (status === 400) {
                return res.status(400).json({ data });
            } else {
                return res.status(500).json({ error: true, data });
            }
        }
        res.status(200).json({ data });
    }

    //enviar el token y refresh token por headers en vez de por body?
    static async login(req: Request, res: Response) {
        const { status, error, data } = await UserService.getUser(req.body);

        if (error) {
            if (status === 401) {
                return res.status(401).json({ data });
            } else if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res.status(500).json({ error: true, data });
            }
        }

        const { accessToken, refreshToken, ...userData } = data;
        // console.log(accessToken, refreshToken)

        res.header("x-access-token", accessToken);
        res.header("x-refresh-token", refreshToken);

        return res.status(201).json({ data: userData });
    }

    static async refreshToken(req: Request, res: Response) {
        const { status, error, data } =
            await UserService.verifyRefreshToken(req);

        if (error) {
            if (status === 401) {
                return res.status(401).json({ error: true, data });
            } else if (status === 403) {
                return res.status(403).json({ error: true, data });
            } else {
                return res.status(500).json({ error: true, data });
            }
        }

        return res.status(201).json({ data });
    }

    static async updatePassword(req: Request, res: Response) {
        const { status, error, data } = await UserService.changePass(req.body);

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else if (status === 400) {
                return res.status(400).json({ data });
            } else {
                return res.status(500).json({ error: true, data });
            }
        }
        res.status(201).json({ data });
    }

    static async deleteUser(req: Request, res: Response) {
        const id = Number(req.query.id);
        const { status, error, data } = await UserService.eraserUser(id);

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res.status(500).json({ error: true, data });
            }
        }
        res.status(204).json({ data });
    }
}

export default UserControllers;
