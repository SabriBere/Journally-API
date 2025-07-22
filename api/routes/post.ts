import { Router } from "express";
import { validatePost } from "../middlewares/postValidation";
import PostControllers from "../controllers/postControllers";
const router = Router();

//crear post dentro de una colección para un usuario
router.post("/create", validatePost, PostControllers.createPost);

//crear post sin colección asignada
router.post("/createOne", validatePost, PostControllers.onePost);

//asignar un post a una colección, si no la tiene

//editar un post

//buscar un post por id

//todos los post de un usuario
router.get("/", PostControllers.allPost);

export default router;
