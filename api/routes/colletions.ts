import { Router } from "express"
//lamar a los validadores
import CollectionsControllers from "../controllers/collectionsControllers";
const router = Router()

//crear una colección
router.post("/createCollection", CollectionsControllers.createCollection)

//obtener el listado de una colección

//actualizar el nombre de una colección

//eliminar una colección

export default router;