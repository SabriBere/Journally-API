import { Router } from "express";
import postControllers from "../controllers/postControllers";
const router = Router();

router.get("/", postControllers.allPost);

export default router;
