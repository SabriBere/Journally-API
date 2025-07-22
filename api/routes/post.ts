import { Router } from "express";
import { validatePost } from "../middlewares/postValidation";
import postControllers from "../controllers/postControllers";
const router = Router();

//crear post dentro de una colección para un usuario
router.post("/create", validatePost, postControllers.createPost);

//editar un post

//buscar un post por id

//todos los post de un usuario
router.get("/", postControllers.allPost);

//editar un post

export default router;
