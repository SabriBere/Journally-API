import { Router } from "express";
import {
    validatePost,
    validatePostUpdate,
} from "../middlewares/postValidation";
import { authenticateToken } from "../middlewares/authtenticatedToken";
import PostControllers from "../controllers/postControllers";
const router = Router();

//crear post dentro de una colección para un usuario
router.post(
    "/create",
    authenticateToken,
    validatePost,
    PostControllers.createPost
);

//crear post sin colección asignada
router.post(
    "/createOne",
    authenticateToken,
    validatePost,
    PostControllers.onePost
);

//asignar un post a una colección, si no la tiene
router.put("/updateOne", authenticateToken, PostControllers.assingColletion);

//editar un post, cambiar titulo o descripción
router.put(
    "/updatePost",
    authenticateToken,
    validatePostUpdate,
    PostControllers.updatePost
);

//autosave de post, usado por el editor y por el websocket
router.put(
    "/autosave",
    authenticateToken,
    validatePostUpdate,
    PostControllers.autoSavePost
);

//buscar un post por id
router.get("/findOne", validatePost, PostControllers.findPost);

//todos los post de un usuario, con colecciones incluidas
router.get("/", authenticateToken, PostControllers.allPost);

//eliminar un post de un usuario
router.delete("/deletePost", authenticateToken, PostControllers.deletePost);

export default router;
