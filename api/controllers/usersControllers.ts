import { Request, Response } from "express";
import UserService from "../services/usersServices";

class UserControllers {
    static async create(req: Request, res: Response) {
        const { status, error, data } = await UserService.createUser(req.body);
        // if (error) return res.status(404).json({ error });
        res.status(200).json({ data });
    }

    static async login(req: Request, res: Response) {
        const { status, error, data } = await UserService.getUser(req.body);
        if (error) {
            //agregar 401 por credenciales invalidas
            if (status === 401) {
                return res.status(401).json({ data });
            } else {
                return res.status(500).json({ error: true, data });
            }
        }
        res.status(201).json({ data });
    }
}

export default UserControllers;
