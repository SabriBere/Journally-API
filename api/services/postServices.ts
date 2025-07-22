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

    static async createWithOutCollection(
        userId: number,
        body: {
            title: string;
            description: string;
        }
    ) {
        try {
            const { title, description } = body;

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

    static async getAllPost(id: number) {
        try {
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

            const userPost = await prisma.post.findMany({
                where: {
                    user_id: id,
                },
                include: {
                    collection: true,
                    user: true,
                },
            });

            return { status: 200, error: false, data: userPost };
        } catch (error: any) {
            return { error: true, data: error.message };
        }
    }
}

export default PostServices;
