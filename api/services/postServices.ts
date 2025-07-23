import prisma from "../db/db";
class PostServices {
    //require de tener las colecciones creadas previamente
    static async create(
        userId: number,
        collectionId: number,
        body: {
            title: string;
            description: string;
        }
    ) {
        const { title, description } = body;
        try {
            const userExists = await prisma.user.findUnique({
                where: { user_id: userId },
            });

            if (!userExists) {
                return {
                    status: 404,
                    error: true,
                    data: "El usuario especificado no existe.",
                };
            }

            const collectionExists = await prisma.collection.findUnique({
                where: { collection_id: collectionId },
            });

            if (!collectionExists) {
                return {
                    status: 404,
                    error: true,
                    data: "La colección especificada no existe.",
                };
            }

            const postCreated = await prisma.post.create({
                data: {
                    title: title,
                    description: description,
                    user: {
                        connect: { user_id: userId },
                    },
                    collection: {
                        connect: { collection_id: collectionId },
                    },
                },
            });
            return {
                status: 201,
                error: false,
                data: postCreated,
            };
        } catch (error: any) {
            return { status: 500, error: true, data: error.message };
        }
    }

    //no requiere tener una colección creada
    static async createWithOutCollection(
        userId: number,
        body: {
            title: string;
            description: string;
        }
    ) {
        try {
            const { title, description } = body;

            const userExists = await prisma.user.findUnique({
                where: { user_id: userId },
            });

            if (!userExists) {
                return {
                    status: 404,
                    error: true,
                    data: "El usuario especificado no existe",
                };
            }

            const postCreated = await prisma.post.create({
                data: {
                    title: title,
                    description: description,
                    user: {
                        connect: { user_id: userId },
                    },
                    collection: {},
                },
            });

            return {
                status: 201,
                error: false,
                data: postCreated,
            };
        } catch (error: any) {
            return { status: 500, error: true, data: error.message };
        }
    }

    //depende de que haya una colección existente para probar bien
    static async putInCollection(postId: number, collectionId: number) {
        try {
            //buscar por id el post
            const postExists = await prisma.post.findUnique({
                where: { post_id: postId },
            });

            if (!postExists) {
                return {
                    status: 404,
                    error: true,
                    data: "El post buscado no existe",
                };
            }

            const collectionExists = await prisma.collection.findUnique({
                where: {
                    collection_id: collectionId,
                },
            });

            if (!collectionExists) {
                return {
                    status: 404,
                    error: true,
                    data: "Colección no encontrada",
                };
            }

            const inCollection = await prisma.post.update({
                where: {
                    post_id: postId,
                },
                data: {
                    collection: {
                        connect: { collection_id: collectionId },
                    },
                },
            });

            return {
                status: 200,
                error: false,
                data: inCollection,
            };
        } catch (error: any) {
            return { status: 500, error: true, data: error.message };
        }
    }

    static async onePost(postId: number) {
        try {
            const postFound = await prisma.post.findFirst({
                where: {
                    post_id: postId,
                },
            });

            if (!postFound) {
                return {
                    status: 404,
                    error: true,
                    data: "Post no encontrado",
                };
            }

            return {
                status: 200,
                error: false,
                data: postFound,
            };
        } catch (error: any) {
            return { status: 200, error: true, data: error.message };
        }
    }

    static async editPost(
        postId: number,
        body: {
            title?: string;
            description?: string;
        }
    ) {
        try {
            const dataToUpdate: any = {};

            const { title, description } = body;

            if (title !== "") dataToUpdate.title = title;
            if (description !== "") dataToUpdate.description = description;

            if (Object.keys(dataToUpdate).length === 0) {
                return {
                    status: 400,
                    error: true,
                    data: "No se proporcionó ningún campo para actualizar.",
                };
            }

            const updatedPost = await prisma.post.update({
                where: {
                    post_id: postId,
                },
                data: dataToUpdate,
            });
            return {
                status: 200,
                error: false,
                data: updatedPost,
            };
        } catch (error: any) {
            return { status: 500, error: true, data: error.message };
        }
    }

    //falta que este paginado, buscar por nombre y ordenar
    static async getAllPost(
        id: number,
        page: number,
        searchText?: string,
        orderField?: any,
        orderDirection?: string
    ) {
        console.log("orderField", orderField, "orderDirection", orderDirection);

        try {
            const pageSize: number = 20;
            const skip = (page - 1) * pageSize;

            const userExists = await prisma.user.findUnique({
                where: { user_id: id },
            });

            if (!userExists) {
                return {
                    status: 404,
                    error: true,
                    data: "Usuario no encontrado",
                };
            }

            const totalItems = await prisma.post.count({
                where: {
                    user_id: id,
                    title: {
                        contains: searchText,
                        mode: "insensitive",
                    },
                },
                orderBy: {
                    [orderField]: orderDirection,
                },
            });
            const totalPages = Math.ceil(totalItems / pageSize);

            const userPost = await prisma.post.findMany({
                where: {
                    user_id: id,
                    title: {
                        contains: searchText,
                        mode: "insensitive",
                    },
                },
                include: {
                    collection: true,
                },
                orderBy: {
                    [orderField]: orderDirection,
                },
                skip,
                take: pageSize,
            });

            //ver cómo devolver toda la data necesaria para el frontend
            return {
                status: 200,
                error: false,
                data: { userPost, totalPages },
            };
        } catch (error: any) {
            return { error: true, data: error.message };
        }
    }
}

export default PostServices;
