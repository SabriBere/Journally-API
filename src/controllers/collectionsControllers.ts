import { Request, Response } from "express";
import CollectionServices from "../services/collectionServices";
import { validationResult } from "express-validator";

class CollectionsControllers {
    private static hasValidationErrors(req: Request, res: Response) {
        const errors = validationResult(req);
        if (errors.isEmpty()) return false;
        res.status(400).json({ error: true, data: errors.array() });
        return true;
    }

    static async createCollection(req: Request, res: Response) {
        if (CollectionsControllers.hasValidationErrors(req, res)) return;
        const userId = (req as any).user?.userId;
        const collection = await CollectionServices.create(req.body, userId);

        res.status(201).json({ data: collection });
    }

    static async updateName(req: Request, res: Response) {
        if (CollectionsControllers.hasValidationErrors(req, res)) return;
        const userId = (req as any).user?.userId;
        const updatedCollection = await CollectionServices.update(
            req.body,
            userId
        );

        res.status(200).json({ data: updatedCollection });
    }

    static async deleteCollection(req: Request, res: Response) {
        if (CollectionsControllers.hasValidationErrors(req, res)) return;
        const userId = (req as any).user?.userId;
        const collectionId = Number(req.query.id);

        await CollectionServices.deleteCollection(userId, collectionId);

        res.status(204).send();
    }

    static async listOfCollections(req: Request, res: Response) {
        if (CollectionsControllers.hasValidationErrors(req, res)) return;
        const id = (req as any).user?.userId;
        const page = Number(req.query.page) || 1;
        const searchText = req.query.searchText as string | undefined;
        const orderField =
            (req.query.orderField as string | undefined) ?? "updated_at";
        const orderDirection =
            (req.query.orderDirection as string | undefined) ?? "desc";

        const data = await CollectionServices.allCollections(
            id,
            page,
            searchText,
            orderField,
            orderDirection
        );

        res.status(200).json({ data });
    }

    static async oneCollection(req: Request, res: Response) {
        if (CollectionsControllers.hasValidationErrors(req, res)) return;
        const userId = (req as any).user?.userId;
        const collectionId = Number(req.query.id);

        const collection = await CollectionServices.findCollection(
            userId,
            collectionId
        );

        return res.status(200).json({ data: collection });
    }
}

export default CollectionsControllers;
