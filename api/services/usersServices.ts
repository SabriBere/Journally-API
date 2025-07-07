import prisma from "../db/db";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
class UserService {
    static async createUser(body: {
        email: string;
        password: string;
        user_name?: string;
    }) {
        const { email, password, user_name } = body;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        try {
            const user = await prisma.user.create({
                data: {
                    email: email,
                    password: hashedPassword,
                    user_name: email.split("@")[0],
                },
            });
            return { status: 201, error: false, data: user };
        } catch (error: any) {
            return { status: 500, error: true, data: error.message };
        }
    }

    static async getUser(body: { email: string; password: string }) {
        try {
            const userFinded = await prisma.user.findFirst({
                where: {
                    email: body.email,
                },
            });

            if (!userFinded) {
                return {
                    status: 404,
                    error: true,
                    data: "Usuario no encontrado",
                };
            }

            const isMatch = await bcrypt.compare(
                body.password,
                userFinded.password
            );

            if (!isMatch) {
                return {
                    status: 401,
                    error: true,
                    data: "Credenciales invalidas",
                };
            }

            return {
                status: 201,
                error: false,
                data: {
                    user: userFinded.email,
                    userName: userFinded.user_name,
                },
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

export default UserService;
