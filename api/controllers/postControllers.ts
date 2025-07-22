import { Request, Response } from "express";
import PostServices from "../services/postServices";

class PostControllers {
    static async allPost(req: Request, res: Response) {
        const id = Number(req.query.id);
        const { status, error, data } = await PostServices.getAllPost(id);
        if (error) {
            if (status === 404) {
                return res.status(404).json({ data });
            }
        }
        res.status(200).json({ data });
    }
}

export default PostControllers;
