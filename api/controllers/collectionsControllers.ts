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

    static async deleteCollection(req: Request, res: Response) {
        const collectionId = Number(req.query.id);

        const { status, error, data } =
            await ColletionServices.eraserCollection(collectionId);

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            }
            return res.status(500).json({ data });
        }

        res.status(204).json({ data });
    }

    static async listOfCollections(req: Request, res: Response) {
        const id = (req as any).user?.userId;
        const page = Number(req.query.page) || 1;
        const searchText = req.query.searchText as string | undefined;
        const orderField = req.query.orderField as string | undefined;
        const orderDirection = req.query.orderDirection as string | undefined;

        const { status, error, data } = await ColletionServices.allCollections(
            id,
            page,
            searchText,
            orderField,
            orderDirection
        );

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            }
            return res.status(500).json({ data });
        }

        res.status(200).json({ data });
    }

    static async oneCollection(req: Request, res: Response) {
        const collectionId = Number(req.query.id);

        const { status, error, data } =
            await ColletionServices.findCollection(collectionId);

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res.status(500).json({ data });
            }
        }

        return res.status(200).json({ data });
    }
}

export default CollectionsControllers;
