import { Request, Response } from "express";
import { validationResult } from "express-validator";
import PostServices from "../services/postServices";

class PostControllers {
    static async createPost(req: Request, res: Response) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, data: errors.array() });
        }

        const userId = Number(req.query.userId);
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
            return res.status(500).json({ data });
        }
        res.status(201).json({ data });
    }

    static async onePost(req: Request, res: Response) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, data: errors.array() });
        }

        const userId = Number(req.query.userId);
        const { status, error, data } =
            await PostServices.createWithOutCollection(userId, req.body);

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res.status(500).json({ data });
            }
        }
        res.status(201).json({ data });
    }

    static async assingColletion(req: Request, res: Response) {
        const postId = Number(req.query.postId);
        const userId = Number(req.query.userId);

        const { status, error, data } = await PostServices.putInCollection(
            postId,
            userId
        );

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res.status(500).json([data]);
            }
        }
        res.status(200).json({ data });
    }

    static async findPost(req: Request, res: Response) {
        const postId = Number(req.query.postId);

        const { status, error, data } = await PostServices.onePost(postId);

        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res.status(500).json({ data });
            }
        }

        return res.status(200).json({ data });
    }

    static async updatePost(req: Request, res: Response) {
        const postId = Number(req.query.postId);
        const { status, error, data } = await PostServices.editPost(postId, req.body);
        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res.status(500).json({ data });
            }
        }

        return res.status(200).json({ data });
    }

    static async allPost(req: Request, res: Response) {
        const id = Number(req.query.id);
        const { status, error, data } = await PostServices.getAllPost(id);
        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            } else {
                return res.status(500).json({ data });
            }
        }
        res.status(200).json({ data });
    }
}

export default PostControllers;
