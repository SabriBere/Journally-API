import { Request, Response } from "express";
import UserService from "../services/usersServices";

class UserControllers {
    static async create(req: Request, res: Response) {
        const { error, data } = await UserService.createUser(req.body);
        // if (error) return res.status(404).json({ error });
        res.status(200).json({ data });
    }

    static async login(req: Request, res: Response) {
        const { error, data } = await UserService.getUser();
        // if (error) return res.status(404).json({ data });
        res.status(200).json({ data });
    }
}

export default UserControllers;
