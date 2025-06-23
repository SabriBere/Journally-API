import { Request, Response } from "express";
import EntriesServices from "../services/entriesServices";

class EntriesControllers {
    static async allEntries(req: Request, res: Response) {
        const { error, data } = await EntriesServices.getAll();
        // if (error) return res.status(400).json({ data });
        res.status(200).json({ data });
    }
}

export default EntriesControllers;
