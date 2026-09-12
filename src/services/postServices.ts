import { Prisma } from "@prisma/client";
import prisma from "../db/db";

type PostDescription = Prisma.InputJsonValue;

class PostServices {
    //require de tener las colecciones creadas previamente
    static async create(
        userId: number,
        collectionId: number,
        body: {
            title: string;
            description: PostDescription;
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

            const collectionExists = await prisma.collection.findFirst({
                where: { collection_id: collectionId, user_id: userId },
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
                    title: title.trim(),
                    description: description as never,
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
    static async createWithoutCollection(
        userId: number,
        body: {
            title: string;
            description: PostDescription;
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
                    title: title.trim(),
                    description: description as never,
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
    static async putInCollection(
        userId: number,
        postId: number,
        collectionId: number
    ) {
        try {
            //buscar por id el post
            const postExists = await prisma.post.findFirst({
                where: { post_id: postId, user_id: userId },
            });

            if (!postExists) {
                return {
                    status: 404,
                    error: true,
                    data: "El post buscado no existe",
                };
            }

            const collectionExists = await prisma.collection.findFirst({
                where: {
                    collection_id: collectionId,
                    user_id: userId,
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

    static async onePost(userId: number, postId: number) {
        try {
            const postFound = await prisma.post.findFirst({
                where: {
                    post_id: postId,
                    user_id: userId,
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

    static async autoSavePost(
        userId: number,
        postId: number,
        body: {
            title?: string;
            description?: PostDescription;
        }
    ) {
        try {
            const post = await prisma.post.findFirst({
                where: {
                    post_id: postId,
                    user_id: userId,
                },
            });

            if (!post) {
                return {
                    status: 404,
                    error: true,
                    data: "Post no encontrado para el usuario autenticado.",
                };
            }

            const dataToUpdate: Prisma.PostUpdateInput = {};

            const { title, description } = body;

            if (title !== undefined) {
                const trimmedTitle = title.trim();

                if (!trimmedTitle) {
                    return {
                        status: 400,
                        error: true,
                        data: "El título no puede estar vacío.",
                    };
                }

                dataToUpdate.title = trimmedTitle;
            }

            if (description !== undefined) {
                dataToUpdate.description = description as never;
            }

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

    static async getAllPost(
        id: number,
        page: number,
        searchText?: string,
        orderField?: any,
        orderDirection?: string
    ) {
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
            return { status: 500, error: true, data: error.message };
        }
    }

    static async deletePost(userId: number, postId: number) {
        try {
            const deletedPost = await prisma.post.deleteMany({
                where: {
                    post_id: postId,
                    user_id: userId,
                },
            });

            if (deletedPost.count === 0) {
                return {
                    status: 404,
                    error: true,
                    data: "Post no encontrado",
                };
            }

            return {
                status: 204,
                error: false,
                data: deletedPost,
            };
        } catch (error: any) {
            return {
                status: 500,
                error: true,
                data: error.message,
            };
        }
    }
}

export default PostServices;
