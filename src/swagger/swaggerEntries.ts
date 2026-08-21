/**
 * @swagger
 * components:
 *   securitySchemes:
 *     accessToken:
 *       type: apiKey
 *       in: header
 *       name: x-access-token
 *       description: JWT de acceso devuelto en el header x-access-token.
 *     refreshToken:
 *       type: apiKey
 *       in: header
 *       name: x-refresh-token
 *       description: JWT de refresh devuelto en el header x-refresh-token.
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           description: Payload de respuesta.
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: boolean
 *           example: true
 *         data:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: object
 *           example: Token inválido o expirado
 *     User:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           example: 1
 *         user_name:
 *           type: string
 *           example: sabrina
 *         email:
 *           type: string
 *           format: email
 *           example: sabrina@example.com
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     AuthUser:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           example: 1
 *         user:
 *           type: string
 *           format: email
 *           example: sabrina@example.com
 *         userName:
 *           type: string
 *           example: sabrina
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: sabrina@example.com
 *         user_name:
 *           type: string
 *           minLength: 5
 *           example: sabrina
 *         password:
 *           type: string
 *           minLength: 8
 *           example: password123
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: sabrina@example.com
 *         password:
 *           type: string
 *           example: password123
 *     UpdatePasswordRequest:
 *       type: object
 *       required:
 *         - id
 *         - newPass
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         newPass:
 *           type: string
 *           minLength: 8
 *           example: newPassword123
 *     PostDescription:
 *       description: Contenido JSON del post. Puede ser texto, objeto o array.
 *       oneOf:
 *         - type: string
 *           example: Hoy escribí sobre mis metas.
 *         - type: object
 *           additionalProperties: true
 *           example:
 *             blocks:
 *               - type: paragraph
 *                 text: Hoy escribí sobre mis metas.
 *         - type: array
 *           items:
 *             type: object
 *           example:
 *             - type: paragraph
 *               text: Hoy escribí sobre mis metas.
 *     Post:
 *       type: object
 *       properties:
 *         post_id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Entrada de la mañana
 *         description:
 *           $ref: '#/components/schemas/PostDescription'
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         user_id:
 *           type: integer
 *           example: 1
 *         collection_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *     PostWithCollection:
 *       allOf:
 *         - $ref: '#/components/schemas/Post'
 *         - type: object
 *           properties:
 *             collection:
 *               nullable: true
 *               allOf:
 *                 - $ref: '#/components/schemas/Collection'
 *     PostRequest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         title:
 *           type: string
 *           example: Entrada de la mañana
 *         description:
 *           $ref: '#/components/schemas/PostDescription'
 *     PostUpdateRequest:
 *       type: object
 *       description: Campos editables de un post. Enviar al menos title o description.
 *       minProperties: 1
 *       properties:
 *         title:
 *           type: string
 *           description: No puede quedar vacío.
 *           example: Entrada actualizada
 *         description:
 *           $ref: '#/components/schemas/PostDescription'
 *     Collection:
 *       type: object
 *       properties:
 *         collection_id:
 *           type: integer
 *           example: 1
 *         collection_name:
 *           type: string
 *           example: Diario personal
 *         title:
 *           type: string
 *           example: Diario personal
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         user_id:
 *           type: integer
 *           example: 1
 *     CollectionWithPosts:
 *       allOf:
 *         - $ref: '#/components/schemas/Collection'
 *         - type: object
 *           properties:
 *             posts:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *     CollectionRequest:
 *       type: object
 *       required:
 *         - collectionName
 *         - title
 *       properties:
 *         collectionName:
 *           type: string
 *           example: diario-personal
 *         title:
 *           type: string
 *           example: Diario personal
 *     CollectionUpdateRequest:
 *       type: object
 *       required:
 *         - collectionId
 *         - title
 *       properties:
 *         collectionId:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Diario actualizado
 */

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Registro, login, refresh token y administración de usuarios.
 *   - name: Posts
 *     description: Creación, búsqueda, edición/autosave y eliminación de posts.
 *   - name: Collections
 *     description: Administración de colecciones de posts.
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Registra un usuario.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Usuario creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     userName:
 *                       type: string
 *                       example: sabrina
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: sabrina@example.com
 *       400:
 *         description: Error de validación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Inicia sesión y devuelve los tokens por headers.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       201:
 *         description: Login exitoso. Los headers contienen los JWT de acceso y refresh.
 *         headers:
 *           x-access-token:
 *             schema:
 *               type: string
 *             description: Token JWT de acceso.
 *           x-refresh-token:
 *             schema:
 *               type: string
 *             description: Token JWT de refresh.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AuthUser'
 *       401:
 *         description: Credenciales inválidas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/users/refresh:
 *   post:
 *     summary: Renueva tokens usando un refresh token.
 *     tags:
 *       - Users
 *     security:
 *       - refreshToken: []
 *     responses:
 *       201:
 *         description: Tokens renovados correctamente.
 *         headers:
 *           x-access-token:
 *             schema:
 *               type: string
 *             description: Nuevo JWT de acceso.
 *           x-refresh-token:
 *             schema:
 *               type: string
 *             description: Nuevo JWT de refresh.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AuthUser'
 *       401:
 *         description: Refresh token no proporcionado o inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Refresh token expirado o rechazado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/users/update:
 *   put:
 *     summary: Actualiza la contraseña de un usuario.
 *     tags:
 *       - Users
 *     security:
 *       - accessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordRequest'
 *     responses:
 *       201:
 *         description: Contraseña actualizada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   example: Actualización exitosa
 *       400:
 *         description: Datos inválidos o contraseña repetida.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/users/delete/{id}:
 *   delete:
 *     summary: Elimina el usuario autenticado.
 *     tags:
 *       - Users
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Id del usuario. Actualmente el controlador usa el id del token.
 *     responses:
 *       204:
 *         description: Usuario eliminado.
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/post/create:
 *   post:
 *     summary: Crea un post dentro de una colección.
 *     tags:
 *       - Posts
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: query
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Id de la colección donde se creará el post.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostRequest'
 *     responses:
 *       201:
 *         description: Post creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Error de validación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario o colección no encontrados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/post/createOne:
 *   post:
 *     summary: Crea un post sin colección asignada.
 *     tags:
 *       - Posts
 *     security:
 *       - accessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostRequest'
 *     responses:
 *       201:
 *         description: Post creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Error de validación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/post/updateOne:
 *   put:
 *     summary: Asigna un post existente a una colección.
 *     tags:
 *       - Posts
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post asignado a la colección.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post o colección no encontrados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/post/findOne:
 *   get:
 *     summary: Busca un post por id.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/post/autosave:
 *   put:
 *     summary: Edita o guarda automáticamente cambios de un post.
 *     description: Endpoint unificado para la edición manual y el autosave del editor. Actualiza title, description o ambos.
 *     tags:
 *       - Posts
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Id del post a guardar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostUpdateRequest'
 *           examples:
 *             editTitle:
 *               summary: Editar título
 *               value:
 *                 title: Entrada actualizada
 *             autosaveContent:
 *               summary: Autosave de contenido
 *               value:
 *                 description:
 *                   type: doc
 *                   content:
 *                     - type: paragraph
 *                       content:
 *                         - type: text
 *                           text: Contenido desde el editor
 *             editBoth:
 *               summary: Editar título y contenido
 *               value:
 *                 title: Entrada actualizada
 *                 description:
 *                   blocks:
 *                     - type: paragraph
 *                       text: Hoy escribí sobre mis metas.
 *     responses:
 *       200:
 *         description: Post actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Error de validación o body vacío.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post no encontrado para el usuario autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/post:
 *   get:
 *     summary: Lista los posts del usuario autenticado.
 *     tags:
 *       - Posts
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderField
 *         schema:
 *           type: string
 *           enum: [post_id, title, created_at, updated_at]
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Lista paginada de posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     userPost:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PostWithCollection'
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/post/deletePost:
 *   delete:
 *     summary: Elimina un post por id.
 *     tags:
 *       - Posts
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Post eliminado.
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/collections/createCollection:
 *   post:
 *     summary: Crea una colección para el usuario autenticado.
 *     tags:
 *       - Collections
 *     security:
 *       - accessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollectionRequest'
 *     responses:
 *       201:
 *         description: Colección creada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/collections/allCollections:
 *   get:
 *     summary: Lista las colecciones del usuario autenticado.
 *     tags:
 *       - Collections
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderField
 *         schema:
 *           type: string
 *           enum: [collection_id, collection_name, title, created_at, updated_at]
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Lista paginada de colecciones.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     collectionList:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Collection'
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/collections/collectionId:
 *   get:
 *     summary: Obtiene una colección por id, incluyendo sus posts.
 *     tags:
 *       - Collections
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Colección encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CollectionWithPosts'
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Colección no encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/collections/updateCollection:
 *   put:
 *     summary: Actualiza el título de una colección.
 *     tags:
 *       - Collections
 *     security:
 *       - accessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollectionUpdateRequest'
 *     responses:
 *       200:
 *         description: Colección actualizada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Colección no encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/collections/deteleCollection:
 *   delete:
 *     summary: Elimina una colección por id.
 *     tags:
 *       - Collections
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Colección eliminada.
 *       401:
 *         description: Token inválido o no proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Colección no encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
