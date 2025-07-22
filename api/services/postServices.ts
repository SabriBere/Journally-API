import prisma from "../db/db";
class PostServices {
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
