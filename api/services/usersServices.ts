import prisma from "../db/db";

class UserService {
    static async createUser(body: { email: string; password: string }) {
        try {
            const user = await prisma.user.create({
                data: {
                    email: body.email,
                    password: body.password,
                    user_name: body.email.split("@")[0], // ejemplo: username a partir del email
                },
            });
            return { error: false, data: user };
        } catch (error: any) {
            return { error: true, data: error.message };
        }
    }

    static async getUser() {
        try {
            return { error: false, data: "user" };
        } catch (error: any) {
            return { error: true, data: error.message };
        }
    }
}

export default UserService;
