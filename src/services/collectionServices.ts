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

        return collectionCreated;
    }

    static async update(
        body: { title: string; collectionId: number },
        userId: number
    ) {
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
            throw new AppError(
                400,
                "COLLECTION_NOT_FOUND",
                "Colección no encontrada"
            );
        }

        return updatedCollection;
    }

    static async deleteCollection(userId: number, collectionId: number) {
        const collection = await prisma.collection.findFirst({
            where: {
                collection_id: collectionId,
                user_id: userId,
            },
        });

        if (!collection) {
            throw new AppError(
                404,
                "COLLECTION_NOT_FOUND",
                "No se encontró la colección"
            );
        }

        return prisma.collection.deleteMany({
            where: {
                collection_id: collectionId,
                user_id: userId,
            },
        });
    }

    static async allCollections(
        id: number,
        page: number,
        searchText?: string,
        orderField?: any,
        orderDirection?: string
    ) {
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

        return { collectionList, totalPages };
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
