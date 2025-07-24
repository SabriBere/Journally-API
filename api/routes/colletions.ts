import { Router } from "express"
//lamar a los validadores
import CollectionsControllers from "../controllers/collectionsControllers";
const router = Router()

//crear una colección
router.post("/createCollection", CollectionsControllers.createCollection)

//obtener el listado de una colección, paginados y con filtros
router.get("/", CollectionsControllers.listOfCollections)

//actualizar el nombre de una colección
router.put("/updateCollection", CollectionsControllers.updateName)

//eliminar una colección
router.delete("/deteleCollection", CollectionsControllers.deleteCollection)



export default router;