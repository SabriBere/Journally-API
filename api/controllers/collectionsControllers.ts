import { Request, Response } from "express";
import ColletionServices from "../services/collectionServices";

class CollectionsControllers {
    static async createCollection(req: Request, res: Response) {
        const { status, error, data } = await ColletionServices.create(
            req.body
        );

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            }
            return res.status(500).json({ data });
        }

        res.status(201).json({ data });
    }

    static async updateName(req: Request, res: Response) {
        const { status, error, data } = await ColletionServices.update(
            req.body
        );

        if (error) {
            if (status === 404) {
                return res.status(400).json({ data });
            }
            return res.status(500).json({ data });
        }

        res.status(200).json({ data });
    }
}

export default CollectionsControllers;
