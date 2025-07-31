import { Router } from "express";
import { authenticateToken } from "../middlewares/authtenticatedToken";
import CollectionsControllers from "../controllers/collectionsControllers";
const router = Router();

//crear una colección
router.post(
    "/createCollection",
    authenticateToken,
    CollectionsControllers.createCollection
);

//obtener el listado de una colección, paginados y con filtros
router.get(
    "/allCollections",
    authenticateToken,
    CollectionsControllers.listOfCollections
);

//obtener una colección por id
router.get(
    "/collectionId",
    authenticateToken,
    CollectionsControllers.oneCollection
);

//actualizar el nombre de una colección
router.put(
    "/updateCollection",
    authenticateToken,
    CollectionsControllers.updateName
);

//eliminar una colección
router.delete(
    "/deteleCollection",
    authenticateToken,
    CollectionsControllers.deleteCollection
);

export default router;
