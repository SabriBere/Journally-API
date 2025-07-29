import { generateRefreshToken, generateToken } from "../utils/auth";
import jwt from "jsonwebtoken";
import prisma from "../db/db";
import bcrypt from "bcrypt";

const SALT_ROUNDS = Number(process.env.SALT_ROUND) || 10
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
                    data: "Credenciales inválidas",
                };
            }

            const accessToken = generateToken({ userId: userFinded.user_id });
            const refreshToken = generateRefreshToken({
                userId: userFinded.user_id,
            });

            return {
                status: 201,
                error: false,
                data: {
                    userId: userFinded.user_id,
                    user: userFinded.email,
                    userName: userFinded.user_name,
                    token: accessToken,
                    refresh: refreshToken,
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

    static async verifyRefreshToken(req: any) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            console.log("🍪 Cookie refreshToken:", refreshToken);

            if (!refreshToken) {
                return {
                    status: 401,
                    error: true,
                    data: "No se encontró el refresh token",
                };
            }

            const decoded: any = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET!
            );

            console.log("✅ Decoded:", decoded);

            const userId = decoded.userId;

            const user = await prisma.user.findUnique({
                where: { user_id: userId },
            });

            if (!user) {
                return {
                    status: 404,
                    error: true,
                    data: "Usuario no encontrado",
                };
            }

            const newAccessToken = generateToken({ userId: user.user_id });

            return {
                status: 200,
                error: false,
                data: {
                    token: newAccessToken,
                    userId: user.user_id,
                    user: user.email,
                    userName: user.user_name,
                },
            };
        } catch (error: any) {
            console.error("❌ JWT verify error:", error);
            return {
                status: 403,
                error: true,
                data: "Refresh token inválido o expirado",
            };
        }
    }

    static async changePass(body: { id: number; newPass: string }) {
        const { id, newPass } = body;

        if (!newPass) {
            return {
                status: 400,
                error: true,
                data: "Faltan datos",
            };
        }

        try {
            const userFind = await prisma.user.findFirst({
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
                newPass,
                userFind?.password
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
                    user_id: userFind?.user_id,
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

    static async eraserUser(id: number) {
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

            //cuando tenga posteos creados debería ser en cascada el delete
            const deletedUser = await prisma.user.delete({
                where: {
                    user_id: id,
                },
            });

            if (!deletedUser) {
                return {
                    status: 400,
                    error: true,
                    data: "Error al eliminar usuario",
                };
            }

            return {
                status: 204,
                error: false,
                data: "Usuario eliminado con exito",
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
