import { Request, Response } from "express";
import { validationResult } from "express-validator";
import PostServices from "../services/postServices";

class PostControllers {
    static async createPost(req: Request, res: Response) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, data: errors.array() });
        }

        const userId = (req as any).user?.userId;
        const collectionId = Number(req.query.collectionId);

        const { status, error, data } = await PostServices.create(
            userId,
            collectionId,
            req.body
        );

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            }
            return res.status(500).json({ data: "Error interno del servidor" });
        }
        res.status(201).json({ data });
    }

    static async onePost(req: Request, res: Response) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, data: errors.array() });
        }

        const userId = (req as any).user?.userId;
        const { status, error, data } =
            await PostServices.createWithOutCollection(userId, req.body);

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res
                    .status(500)
                    .json({ data: "Error interno del servidor" });
            }
        }
        res.status(201).json({ data });
    }

    static async assingColletion(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ error: true, data: errors.array() });
        const userId = (req as any).user?.userId;
        const postId = Number(req.query.postId);
        const collectionId = Number(req.query.collectionId);

        const { status, error, data } = await PostServices.putInCollection(
            userId,
            postId,
            collectionId
        );

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res
                    .status(500)
                    .json({ data: "Error interno del servidor" });
            }
        }
        res.status(200).json({ data });
    }

    static async findPost(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ error: true, data: errors.array() });
        const userId = (req as any).user?.userId;
        const postId = Number(req.query.postId);

        const { status, error, data } = await PostServices.onePost(
            userId,
            postId
        );

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res
                    .status(500)
                    .json({ data: "Error interno del servidor" });
            }
        }

        return res.status(200).json({ data });
    }

    static async autoSavePost(req: Request, res: Response) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, data: errors.array() });
        }

        const userId = (req as any).user?.userId;
        const postId = Number(req.query.postId);

        const { status, error, data } = await PostServices.autoSavePost(
            userId,
            postId,
            req.body
        );

        if (error) {
            if (status === 400) {
                return res.status(400).json({ data });
            }

            if (status === 404) {
                return res.status(404).json({ data });
            }

            return res.status(500).json({ data: "Error interno del servidor" });
        }

        return res.status(200).json({ data });
    }

    static async allPost(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ error: true, data: errors.array() });
        const id = (req as any).user?.userId;
        const page = Number(req.query.page) || 1;
        const searchText = req.query.searchText as string | undefined;
        const orderField =
            (req.query.orderField as string | undefined) ?? "updated_at";
        const orderDirection =
            (req.query.orderDirection as string | undefined) ?? "desc";

        const { status, error, data } = await PostServices.getAllPost(
            id,
            page,
            searchText,
            orderField,
            orderDirection
        );
        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res
                    .status(500)
                    .json({ data: "Error interno del servidor" });
            }
        }
        res.status(200).json({ data });
    }

    static async deletePost(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ error: true, data: errors.array() });
        const userId = (req as any).user?.userId;
        const postId = Number(req.query.postId);
        const { status, error, data } = await PostServices.eraserPost(
            userId,
            postId
        );

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res
                    .status(500)
                    .json({ data: "Error interno del servidor" });
            }
        }
        return res.status(204).json({ data });
    }
}

export default PostControllers;
