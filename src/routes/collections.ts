import { Router } from "express";
import { authenticateToken } from "../middlewares/authenticatedToken";
import CollectionsControllers from "../controllers/collectionsControllers";
import {
    validateCollectionCreate,
    validateCollectionId,
    validateCollectionUpdate,
} from "../middlewares/collectionValidation";
import { validatePagination } from "../middlewares/queryValidation";
const router = Router();

//crear una colección
router.post(
    "/createCollection",
    authenticateToken,
    validateCollectionCreate,
    CollectionsControllers.createCollection
);

//obtener el listado de una colección, paginados y con filtros
router.get(
    "/allCollections",
    authenticateToken,
    validatePagination,
    CollectionsControllers.listOfCollections
);

//obtener una colección por id
router.get(
    "/collectionId",
    authenticateToken,
    validateCollectionId,
    CollectionsControllers.oneCollection
);

//actualizar el nombre de una colección
router.put(
    "/updateCollection",
    authenticateToken,
    validateCollectionUpdate,
    CollectionsControllers.updateName
);

//eliminar una colección
router.delete(
    ["/deleteCollection", "/deteleCollection"],
    authenticateToken,
    validateCollectionId,
    CollectionsControllers.deleteCollection
);

export default router;
