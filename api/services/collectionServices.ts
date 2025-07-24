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
}

export default ColletionServices;
