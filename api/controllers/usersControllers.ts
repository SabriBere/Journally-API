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

        // ✅ Ahora sí: seteamos cookie acá
        res.cookie("refreshToken", data.refreshToken, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === "production",
            // sameSite: "strict",
            path: "/api/refresh", // o "/"
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        });

        // También podés evitar enviar el refreshToken en el JSON si está en cookie
        // const { refreshToken, ...rest } = data;

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
