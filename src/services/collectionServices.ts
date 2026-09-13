import prisma from "../db/db";
import AppError from "../errors/AppError";

class CollectionServices {
    static async create(
        body: {
            collectionName: string;
            title: string;
        },
        userId: number
    ) {
        try {
            const { collectionName, title } = body;

            const collectionCreated = await prisma.collection.create({
                data: {
                    collection_name: collectionName,
                    title: title,
                    user: {
                        connect: { user_id: userId },
                    },
                },
            });

            return {
                status: 201,
                error: false,
                data: collectionCreated,
            };
        } catch (error: any) {
            return { status: 500, error: true, data: error.message };
        }
    }

    static async update(
        body: { title: string; collectionId: number },
        userId: number
    ) {
        try {
            const { title, collectionId } = body;

            const updatedCollection = await prisma.collection.updateMany({
                where: {
                    collection_id: collectionId,
                    user_id: userId,
                },
                data: {
                    title: title,
                },
            });

            if (updatedCollection.count === 0) {
                return {
                    status: 404,
                    error: true,
                    data: "Colección no encontrada",
                };
            }

            return {
                status: 200,
                error: false,
                data: updatedCollection,
            };
        } catch (error: any) {
            return { status: 500, error: true, data: error.message };
        }
    }

    static async deleteCollection(userId: number, collectionId: number) {
        try {
            const collection = await prisma.collection.findFirst({
                where: {
                    collection_id: collectionId,
                    user_id: userId,
                },
            });

            if (!collection) {
                return {
                    status: 404,
                    error: true,
                    data: "No se encontró la colección",
                };
            }
            const deleteCollection = await prisma.collection.deleteMany({
                where: {
                    collection_id: collectionId,
                    user_id: userId,
                },
            });

            return {
                status: 204,
                error: false,
                data: deleteCollection,
            };
        } catch (error: any) {
            return {
                status: 500,
                error: true,
                data: error.message,
            };
        }
    }

    static async allCollections(
        id: number,
        page: number,
        searchText?: string,
        orderField?: any,
        orderDirection?: string
    ) {
        try {
            const pageSize: number = 20;
            const skip = (page - 1) * pageSize;

            const totalItems = await prisma.collection.count({
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

            const collectionList = await prisma.collection.findMany({
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
                skip,
                take: pageSize,
            });

            return {
                status: 200,
                error: false,
                data: { collectionList, totalPages },
            };
        } catch (error: any) {
            return { status: 500, error: true, data: error.message };
        }
    }

    static async findCollection(userId: number, collectionId: number) {
        const collectionFound = await prisma.collection.findFirst({
            where: {
                collection_id: collectionId,
                user_id: userId,
            },
            include: {
                posts: true,
            },
        });

        if (!collectionFound) {
            throw new AppError(
                404,
                "COLLECTION_NOT_FOUND",
                "Colección no encontrada"
            );
        }

        return collectionFound;
    }
}

export default CollectionServices;
