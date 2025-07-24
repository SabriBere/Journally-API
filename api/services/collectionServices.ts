import prisma from "../db/db";

class ColletionServices {
    static async create(body: {
        collectionName: string;
        title: string;
        userId: number;
    }) {
        try {
            const { collectionName, title, userId } = body;

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
                error: true,
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
}

export default ColletionServices;
