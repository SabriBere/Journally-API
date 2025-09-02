import prisma from "../db/db";

class ColletionServices {
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

    static async update(body: { title: string; collectionId: number }) {
        try {
            const { title, collectionId } = body;

            const updatedCollection = await prisma.collection.update({
                where: {
                    collection_id: collectionId,
                },
                data: {
                    title: title,
                },
            });

            if (!updatedCollection) {
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

    static async eraserCollection(collectionId: number) {
        try {
            const collection = await prisma.collection.findUnique({
                where: {
                    collection_id: collectionId,
                },
            });

            if (!collection) {
                return {
                    status: 404,
                    error: true,
                    data: "No se encontró la colección",
                };
            }
            const deleteCollection = await prisma.collection.delete({
                where: {
                    collection_id: collectionId,
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

    static async findCollection(collectionId: number) {
        try {
            const collectionFound = await prisma.collection.findUnique({
                where: {
                    collection_id: collectionId,
                },
                include: {
                    posts: true,
                },
            });

            if (!collectionFound) {
                return {
                    status: 404,
                    error: true,
                    data: "Colección no encontrada",
                };
            }

            return {
                status: 200,
                error: false,
                data: collectionFound,
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

export default ColletionServices;
