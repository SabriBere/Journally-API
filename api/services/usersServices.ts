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
                    user_name: `${user_name}`,
                },
            });
            return {
                status: 201,
                error: false,
                data: { userName: user.user_name, email: user.email },
            };
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

    static async changePass(body: { id: number; newPass: string }) {
        const { id, newPass } = body;

        try {
            const userFind = await prisma.user.findUnique({
                where: {
                    user_id: id,
                },
            });

            if (!userFind) {
                return {
                    status: 404,
                    error: true,
                    data: "Usuario no encontrado",
                };
            }

            const isSamePass = await bcrypt.compare(
                body.newPass,
                userFind.password
            );

            if (isSamePass) {
                return {
                    status: 400,
                    error: false,
                    data: "Ingrese una contraseña diferente a la anterior",
                };
            }

            const newHashPass = await bcrypt.hash(newPass, SALT_ROUNDS);

            await prisma.user.update({
                where: {
                    user_id: id,
                },
                data: {
                    password: newHashPass,
                },
            });

            return {
                status: 201,
                error: false,
                data: "Actualización exitosa",
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
