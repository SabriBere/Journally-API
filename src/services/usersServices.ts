import { generateRefreshToken, generateToken } from "../utils/auth";
import { Prisma } from "@prisma/client";
import prisma from "../db/db";
import bcrypt from "bcrypt";
import { createHash } from "crypto";
import AppError from "../errors/AppError";
import observabilityLogger from "../loggers/observabilityLogger";

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
            throw new AppError(
                400,
                "USER_NAME_REQUIRED",
                "El nombre de usuario es obligatorio"
            );
        }

        try {
            const userExists = await prisma.user.findFirst({
                where: {
                    OR: [{ email }, { user_name }],
                },
            });

            if (userExists) {
                throw new AppError(
                    409,
                    "USER_ALREADY_EXISTS",
                    userExists.email === email
                        ? "El email ya está registrado"
                        : "El nombre de usuario ya está en uso"
                );
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    user_name,
                },
            });
            return { userName: user.user_name, email: user.email };
        } catch (error: unknown) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new AppError(
                    409,
                    "USER_ALREADY_EXISTS",
                    "El email o nombre de usuario ya está registrado"
                );
            }

            throw error;
        }
    }

    static async getUser(body: { email: string; password: string }) {
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
            throw new AppError(
                401,
                "INVALID_CREDENTIALS",
                "Credenciales inválidas"
            );
        }

        const isMatch = await bcrypt.compare(
            body.password,
            userFinded.password
        );
        if (!isMatch) {
            throw new AppError(
                401,
                "INVALID_CREDENTIALS",
                "Credenciales inválidas"
            );
        }
        const accessToken = generateToken({ userId: userFinded.user_id });
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
            userId: userFinded.user_id,
            user: userFinded.email,
            userName: userFinded.user_name,
            accessToken,
            refreshToken,
        };
    }

    static async verifyRefreshToken(req: any) {
        const { userId } = req.user;
        const presentedToken = req.refreshToken as string;

        const session = await prisma.refreshSession.findUnique({
            where: { token_hash: hashToken(presentedToken) },
        });

        if (!session || session.expires_at <= new Date()) {
            throw new AppError(
                403,
                "INVALID_REFRESH_SESSION",
                "Refresh token inválido o reutilizado"
            );
        }

        if (session.user_id !== userId) {
            observabilityLogger.warn("refresh_session_identity_mismatch", {
                userId,
                operation: "refresh_token",
                status: "rejected",
                reasonCode: "SESSION_USER_MISMATCH",
            });
            throw new AppError(
                403,
                "INVALID_REFRESH_SESSION",
                "Refresh token inválido o reutilizado"
            );
        }

        const user = await prisma.user.findUnique({
            where: { user_id: userId },
        });

        if (!user) {
            throw new AppError(
                403,
                "INVALID_REFRESH_SESSION",
                "Refresh token inválido o reutilizado"
            );
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
            newAccessToken,
            newRefreshToken,
            userId: user.user_id,
            user: user.email,
            userName: user.user_name,
        };
    }

    static revokeRefreshToken(token: string) {
        return prisma.refreshSession.deleteMany({
            where: { token_hash: hashToken(token) },
        });
    }

    static async eraserUser(id: number) {
        const userExists = await prisma.user.findUnique({
            where: { user_id: id },
        });

        if (!userExists) {
            throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
        }

        //cuando tenga posteos creados debería ser en cascada el delete
        return prisma.user.delete({
            where: {
                user_id: id,
            },
        });
    }
}

export default UserService;
