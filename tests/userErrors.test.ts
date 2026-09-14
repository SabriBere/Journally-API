import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import request, { Response } from "supertest";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

const userFindFirst = jest.fn<() => Promise<unknown>>();
const userCreate = jest.fn<() => Promise<unknown>>();
const userFindUnique = jest.fn<() => Promise<unknown>>();
const userDelete = jest.fn<() => Promise<unknown>>();
const refreshSessionCreate = jest.fn<() => Promise<unknown>>();
const refreshSessionFindUnique = jest.fn<() => Promise<unknown>>();
const refreshSessionDelete = jest.fn<() => Promise<unknown>>();
const refreshSessionDeleteMany = jest.fn<() => Promise<unknown>>();
const transaction = jest.fn<() => Promise<unknown>>();
const bcryptCompare = jest.fn<() => Promise<boolean>>();
const bcryptHash = jest.fn<() => Promise<string>>();
const captureException = jest.fn();
const observabilityInfo = jest.fn();

jest.mock("../src/db/db", () => ({
    __esModule: true,
    default: {
        user: {
            findFirst: userFindFirst,
            create: userCreate,
            findUnique: userFindUnique,
            delete: userDelete,
        },
        refreshSession: {
            create: refreshSessionCreate,
            findUnique: refreshSessionFindUnique,
            delete: refreshSessionDelete,
            deleteMany: refreshSessionDeleteMany,
        },
        $transaction: transaction,
    },
}));

jest.mock("bcrypt", () => ({
    __esModule: true,
    default: {
        compare: bcryptCompare,
        hash: bcryptHash,
    },
}));

jest.mock("@sentry/node", () => ({
    init: jest.fn(),
    setupExpressErrorHandler: jest.fn(
        (
            app: { use: (middleware: unknown) => void },
            options: { shouldHandleError: (error: unknown) => boolean }
        ) => {
            app.use(
                (
                    error: unknown,
                    _req: unknown,
                    _res: unknown,
                    next: (error: unknown) => void
                ) => {
                    if (options.shouldHandleError(error)) {
                        captureException(error);
                    }
                    next(error);
                }
            );
        }
    ),
}));

jest.mock("../src/loggers/logger", () => ({
    __esModule: true,
    default: { error: jest.fn() },
}));

jest.mock("../src/loggers/observabilityLogger", () => ({
    __esModule: true,
    default: {
        info: observabilityInfo,
        warn: jest.fn(),
    },
}));

import app from "../src/app";
import logger from "../src/loggers/logger";

const validCredentials = {
    email: "user@example.test",
    password: "ValidPassword123!",
};

const login = () =>
    request(app).post("/api/users/login").send(validCredentials);

const expectUnexpectedError = (
    response: Response,
    error: Error,
    path = "/api/users/login",
    method = "POST"
) => {
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
        error: true,
        data: "Error interno del servidor",
    });
    expect(response.text).not.toContain(error.message);
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(error);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
        "Unexpected request error",
        expect.objectContaining({
            error,
            method,
            path,
            status: 500,
        })
    );
};

describe("POST /api/users/login error propagation", () => {
    beforeEach(() => {
        userFindFirst.mockReset();
        userCreate.mockReset();
        refreshSessionCreate.mockReset();
        bcryptCompare.mockReset();
        bcryptHash.mockReset();
        captureException.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("preserves the successful response contract", async () => {
        userFindFirst.mockResolvedValue({
            user_id: 7,
            user_name: "Test User",
            email: validCredentials.email,
            password: "stored hash",
        });
        bcryptCompare.mockResolvedValue(true);
        refreshSessionCreate.mockResolvedValue({ session_id: 1 });

        const response = await login();

        expect(response.status).toBe(201);
        expect(response.headers["x-access-token"]).toEqual(expect.any(String));
        expect(response.headers["x-refresh-token"]).toEqual(expect.any(String));
        expect(response.body).toEqual({
            data: {
                userId: 7,
                user: validCredentials.email,
                userName: "Test User",
            },
        });
    });

    test("returns safe credentials for an unknown email without reporting it", async () => {
        userFindFirst.mockResolvedValue(null);
        bcryptCompare.mockResolvedValue(false);

        const response = await login();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ data: "Credenciales inválidas" });
        expect(bcryptCompare).toHaveBeenCalledTimes(1);
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("returns safe credentials for a wrong password without reporting it", async () => {
        userFindFirst.mockResolvedValue({
            user_id: 7,
            email: validCredentials.email,
            password: "stored hash",
        });
        bcryptCompare.mockResolvedValue(false);

        const response = await login();

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ data: "Credenciales inválidas" });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("preserves and reports a Prisma lookup error", async () => {
        const databaseError = new Error("private find user failure");
        userFindFirst.mockRejectedValue(databaseError);

        expectUnexpectedError(await login(), databaseError);
    });

    test("preserves and reports a bcrypt error", async () => {
        const bcryptError = new Error("private bcrypt failure");
        userFindFirst.mockResolvedValue({
            user_id: 7,
            email: validCredentials.email,
            password: "stored hash",
        });
        bcryptCompare.mockRejectedValue(bcryptError);

        expectUnexpectedError(await login(), bcryptError);
    });

    test("preserves and reports a refresh session creation error", async () => {
        const databaseError = new Error("private session failure");
        userFindFirst.mockResolvedValue({
            user_id: 7,
            email: validCredentials.email,
            password: "stored hash",
        });
        bcryptCompare.mockResolvedValue(true);
        refreshSessionCreate.mockRejectedValue(databaseError);

        expectUnexpectedError(await login(), databaseError);
    });
});

describe("DELETE /api/users/delete/:id error propagation", () => {
    const accessToken = jwt.sign(
        { userId: 7 },
        process.env.JWT_SECRET as string,
        { algorithm: "HS256" }
    );
    const deleteUser = () =>
        request(app)
            .delete("/api/users/delete/7")
            .set("x-access-token", accessToken);

    beforeEach(() => {
        userFindUnique.mockReset();
        userDelete.mockReset();
        captureException.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("preserves a successful 204 response without a body", async () => {
        userFindUnique.mockResolvedValue({ user_id: 7 });
        userDelete.mockResolvedValue({ user_id: 7 });

        const response = await deleteUser();

        expect(response.status).toBe(204);
        expect(response.text).toBe("");
    });

    test("returns a safe 404 without reporting it", async () => {
        userFindUnique.mockResolvedValue(null);

        const response = await deleteUser();

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ data: "Usuario no encontrado" });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("preserves and reports a Prisma lookup error", async () => {
        const databaseError = new Error("private delete lookup failure");
        userFindUnique.mockRejectedValue(databaseError);

        expectUnexpectedError(
            await deleteUser(),
            databaseError,
            "/api/users/delete/7",
            "DELETE"
        );
    });

    test("preserves and reports a Prisma delete error", async () => {
        const databaseError = new Error("private delete user failure");
        userFindUnique.mockResolvedValue({ user_id: 7 });
        userDelete.mockRejectedValue(databaseError);

        expectUnexpectedError(
            await deleteUser(),
            databaseError,
            "/api/users/delete/7",
            "DELETE"
        );
    });
});

describe("POST /api/users/register error propagation", () => {
    const registration = {
        user_name: "New User",
        email: "new-user@example.test",
        password: "ValidPassword123!",
    };
    const register = () =>
        request(app).post("/api/users/register").send(registration);

    beforeEach(() => {
        userFindFirst.mockReset();
        userCreate.mockReset();
        bcryptHash.mockReset();
        captureException.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("preserves the observable successful response contract", async () => {
        userFindFirst.mockResolvedValue(null);
        bcryptHash.mockResolvedValue("hashed password");
        userCreate.mockResolvedValue({
            user_id: 8,
            user_name: registration.user_name,
            email: registration.email,
        });

        const response = await register();

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            data: {
                userName: registration.user_name,
                email: registration.email,
            },
        });
    });

    test("returns a safe conflict for an existing user without reporting it", async () => {
        userFindFirst.mockResolvedValue({ email: registration.email });

        const response = await register();

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ data: "El email ya está registrado" });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("translates Prisma P2002 into a safe 409 without reporting it", async () => {
        const uniqueError = new Prisma.PrismaClientKnownRequestError(
            "private unique constraint detail",
            {
                code: "P2002",
                clientVersion: "test",
            }
        );
        userFindFirst.mockResolvedValue(null);
        bcryptHash.mockResolvedValue("hashed password");
        userCreate.mockRejectedValue(uniqueError);

        const response = await register();

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            data: "El email o nombre de usuario ya está registrado",
        });
        expect(response.text).not.toContain(uniqueError.message);
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("preserves and reports an unknown Prisma error", async () => {
        const databaseError = new Error("private create user failure");
        userFindFirst.mockResolvedValue(null);
        bcryptHash.mockResolvedValue("hashed password");
        userCreate.mockRejectedValue(databaseError);

        expectUnexpectedError(
            await register(),
            databaseError,
            "/api/users/register"
        );
    });
});

describe("POST /api/users/refresh error propagation", () => {
    const refreshToken = jwt.sign(
        { userId: 7 },
        process.env.JWT_REFRESH_SECRET as string,
        { algorithm: "HS256", expiresIn: "1h" }
    );
    const refresh = (token = refreshToken) =>
        request(app).post("/api/users/refresh").set("x-refresh-token", token);
    const validSession = {
        session_id: 10,
        user_id: 7,
        expires_at: new Date(Date.now() + 60_000),
    };
    const validUser = {
        user_id: 7,
        user_name: "Test User",
        email: "user@example.test",
    };

    beforeEach(() => {
        refreshSessionFindUnique.mockReset();
        refreshSessionDelete.mockReset();
        refreshSessionCreate.mockReset();
        userFindUnique.mockReset();
        transaction.mockReset();
        captureException.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("preserves the successful response contract", async () => {
        refreshSessionFindUnique.mockResolvedValue(validSession);
        userFindUnique.mockResolvedValue(validUser);
        refreshSessionDelete.mockResolvedValue(validSession);
        refreshSessionCreate.mockResolvedValue({ session_id: 11 });
        transaction.mockResolvedValue([]);

        const response = await refresh();

        expect(response.status).toBe(201);
        expect(response.headers["x-access-token"]).toEqual(expect.any(String));
        expect(response.headers["x-refresh-token"]).toEqual(expect.any(String));
        expect(response.body).toEqual({
            data: {
                userId: validUser.user_id,
                user: validUser.email,
                userName: validUser.user_name,
            },
        });
    });

    test("rejects a missing token without reporting it", async () => {
        const response = await request(app).post("/api/users/refresh");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Refresh no proporcionado",
        });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("rejects an invalid JWT without reporting it", async () => {
        const response = await refresh("invalid-refresh-token");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Token refresh invalido o expirado",
        });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test.each([
        ["missing", null],
        [
            "expired",
            { ...validSession, expires_at: new Date(Date.now() - 60_000) },
        ],
        ["owned by another user", { ...validSession, user_id: 99 }],
    ])(
        "rejects a %s refresh session without reporting it",
        async (_name, session) => {
            refreshSessionFindUnique.mockResolvedValue(session);

            const response = await refresh();

            expect(response.status).toBe(403);
            expect(response.body).toEqual({
                data: "Refresh token inválido o reutilizado",
            });
            expect(captureException).not.toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
        }
    );

    test("treats a missing user as an invalid session without reporting it", async () => {
        refreshSessionFindUnique.mockResolvedValue(validSession);
        userFindUnique.mockResolvedValue(null);

        const response = await refresh();

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            data: "Refresh token inválido o reutilizado",
        });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("preserves and reports a refresh session lookup error", async () => {
        const databaseError = new Error("private session lookup failure");
        refreshSessionFindUnique.mockRejectedValue(databaseError);

        expectUnexpectedError(
            await refresh(),
            databaseError,
            "/api/users/refresh"
        );
    });

    test("preserves and reports a user lookup error", async () => {
        const databaseError = new Error("private refresh user failure");
        refreshSessionFindUnique.mockResolvedValue(validSession);
        userFindUnique.mockRejectedValue(databaseError);

        expectUnexpectedError(
            await refresh(),
            databaseError,
            "/api/users/refresh"
        );
    });

    test("preserves and reports a refresh transaction error", async () => {
        const databaseError = new Error("private refresh transaction failure");
        refreshSessionFindUnique.mockResolvedValue(validSession);
        userFindUnique.mockResolvedValue(validUser);
        refreshSessionDelete.mockResolvedValue(validSession);
        refreshSessionCreate.mockResolvedValue({ session_id: 11 });
        transaction.mockRejectedValue(databaseError);

        expectUnexpectedError(
            await refresh(),
            databaseError,
            "/api/users/refresh"
        );
    });
});

describe("POST /api/users/logout error propagation", () => {
    const refreshToken = jwt.sign(
        { userId: 7 },
        process.env.JWT_REFRESH_SECRET as string,
        { algorithm: "HS256", expiresIn: "1h" }
    );
    const logout = (token = refreshToken) =>
        request(app).post("/api/users/logout").set("x-refresh-token", token);

    beforeEach(() => {
        refreshSessionDeleteMany.mockReset();
        observabilityInfo.mockClear();
        captureException.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("preserves a successful 204 response without a body", async () => {
        refreshSessionDeleteMany.mockResolvedValue({ count: 1 });

        const response = await logout();

        expect(response.status).toBe(204);
        expect(response.text).toBe("");
        expect(observabilityInfo).toHaveBeenCalledTimes(1);
        expect(observabilityInfo).toHaveBeenCalledWith("user_session_revoked", {
            userId: 7,
            operation: "logout",
            status: "completed",
            count: 1,
        });
        expect(JSON.stringify(observabilityInfo.mock.calls)).not.toContain(
            refreshToken
        );
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("does not emit a log when no persisted session was revoked", async () => {
        refreshSessionDeleteMany.mockResolvedValue({ count: 0 });

        const response = await logout();

        expect(response.status).toBe(204);
        expect(observabilityInfo).not.toHaveBeenCalled();
    });

    test("rejects an invalid token without reporting it", async () => {
        const response = await logout("invalid-refresh-token");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Token refresh invalido o expirado",
        });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
        expect(observabilityInfo).not.toHaveBeenCalled();
    });

    test("preserves and reports a Prisma revocation error", async () => {
        const databaseError = new Error("private revoke session failure");
        refreshSessionDeleteMany.mockRejectedValue(databaseError);

        expectUnexpectedError(
            await logout(),
            databaseError,
            "/api/users/logout"
        );
        expect(observabilityInfo).not.toHaveBeenCalled();
    });
});
