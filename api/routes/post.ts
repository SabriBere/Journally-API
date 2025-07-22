import { Router } from "express";
import postControllers from "../controllers/postControllers";
const router = Router();

//buscar un post por id

//todos los post de un usuario
router.get("/", postControllers.allPost);

//editar un post

export default router;
