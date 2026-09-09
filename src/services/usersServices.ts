import { generateRefreshToken, generateToken } from "../utils/auth";
import { Prisma } from "@prisma/client";
import prisma from "../db/db";
import bcrypt from "bcrypt";
import { createHash } from "crypto";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const hashToken = (token: string) =>
    createHash("sha256").update(token).digest("hex");

const SALT_ROUNDS = Number(process.env.SALT_ROUND) || 10;
class UserService {
    static async createUser(body: {
        email: string;
        password: string;
        user_name?: string;
    }) {
        const { email, password, user_name } = body;

        if (!user_name) {
            return {
                status: 400,
                error: true,
                data: "El nombre de usuario es obligatorio",
            };
        }

        try {
            const userExists = await prisma.user.findFirst({
                where: {
                    OR: [{ email }, { user_name }],
                },
            });

            if (userExists) {
                return {
                    status: 409,
                    error: true,
                    data:
                        userExists.email === email
                            ? "El email ya está registrado"
                            : "El nombre de usuario ya está en uso",
                };
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    user_name,
                },
            });
            return {
                status: 201,
                error: false,
                data: { userName: user.user_name, email: user.email },
            };
        } catch (error: any) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                return {
                    status: 409,
                    error: true,
                    data: "El email o nombre de usuario ya está registrado",
                };
            }

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
                // Ejecutar bcrypt también para usuarios inexistentes reduce diferencias de tiempo.
                await bcrypt.compare(
                    body.password,
                    "$2b$10$C6UzMDM.H6dfI/f/IKcEe.8LzXbFjM/Gp6VfHqKqVxqTqTqTqTqTq"
                );
                return {
                    status: 401,
                    error: true,
                    data: "Credenciales inválidas",
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
            const accessToken = generateToken({ userId: userFinded?.user_id });
            const refreshToken = generateRefreshToken({
                userId: userFinded.user_id,
            });
            await prisma.refreshSession.create({
                data: {
                    token_hash: hashToken(refreshToken),
                    expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
                    user_id: userFinded.user_id,
                },
            });

            return {
                status: 201,
                error: false,
                data: {
                    userId: userFinded.user_id,
                    user: userFinded.email,
                    userName: userFinded.user_name,
                    accessToken,
                    refreshToken,
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
            const { userId } = req.user;
            const presentedToken = req.refreshToken as string;

            const session = await prisma.refreshSession.findUnique({
                where: { token_hash: hashToken(presentedToken) },
            });

            if (
                !session ||
                session.user_id !== userId ||
                session.expires_at <= new Date()
            ) {
                return {
                    status: 403,
                    error: true,
                    data: "Refresh token inválido o reutilizado",
                };
            }

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
            const newRefreshToken = generateRefreshToken({
                userId: user.user_id,
            });

            await prisma.$transaction([
                prisma.refreshSession.delete({
                    where: { session_id: session.session_id },
                }),
                prisma.refreshSession.create({
                    data: {
                        token_hash: hashToken(newRefreshToken),
                        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
                        user_id: user.user_id,
                    },
                }),
            ]);

            return {
                status: 201,
                error: false,
                data: {
                    newAccessToken, //enviar el nuevo token por headers
                    newRefreshToken,
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

    static async revokeRefreshToken(token: string) {
        await prisma.refreshSession.deleteMany({
            where: { token_hash: hashToken(token) },
        });
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
