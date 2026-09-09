import { Router } from "express";
import {
    validatePost,
    validatePostUpdate,
} from "../middlewares/postValidation";
import { authenticateToken } from "../middlewares/authtenticatedToken";
import PostControllers from "../controllers/postControllers";
import {
    validateCollectionQueryId,
    validatePagination,
    validatePostAndCollectionIds,
    validatePostId,
} from "../middlewares/queryValidation";
const router = Router();

//crear post dentro de una colección para un usuario
router.post(
    "/create",
    authenticateToken,
    validateCollectionQueryId,
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
router.put(
    "/updateOne",
    authenticateToken,
    validatePostAndCollectionIds,
    PostControllers.assingColletion
);

//autosave de post, usado por el editor y por el websocket
router.put(
    "/autosave",
    authenticateToken,
    validatePostId,
    validatePostUpdate,
    PostControllers.autoSavePost
);

//buscar un post por id
router.get(
    "/findOne",
    authenticateToken,
    validatePostId,
    PostControllers.findPost
);

//todos los post de un usuario, con colecciones incluidas
router.get("/", authenticateToken, validatePagination, PostControllers.allPost);

//eliminar un post de un usuario
router.delete(
    "/deletePost",
    authenticateToken,
    validatePostId,
    PostControllers.deletePost
);

export default router;
