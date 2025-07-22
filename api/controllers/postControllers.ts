import { Request, Response } from "express";
import PostServices from "../services/postServices";

class PostControllers {
    static async allPost(req: Request, res: Response) {
        const { error, data } = await PostServices.getAllPost();
        // if (error) return res.status(400).json({ data });
        res.status(200).json({ data });
    }
}

export default PostControllers;
