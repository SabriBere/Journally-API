import { Router } from "express"
//lamar a los validadores
import CollectionsControllers from "../controllers/collectionsControllers";
const router = Router()

//crear una colección
router.post("/createCollection", CollectionsControllers.createCollection)

//obtener el listado de una colección, paginados y con filtros

//actualizar el nombre de una colección
router.put("/updateCollection", CollectionsControllers.updateName)

//eliminar un post de una colección
router.delete("/deteleCollection", CollectionsControllers.deleteCollection)

//eliminar una colección

export default router;