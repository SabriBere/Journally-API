import { initialUsers } from "./helpers/helperTest";
import { assertTestDatabase } from "./helpers/testDatabase";
import { afterAll, beforeEach, describe, expect, test } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../src/db/db";
import app from "../src/app";

beforeEach(async () => {
    assertTestDatabase();

    await prisma.$transaction([
        prisma.refreshSession.deleteMany(),
        prisma.post.deleteMany(),
        prisma.collection.deleteMany(),
        prisma.setting.deleteMany(),
        prisma.user.deleteMany(),
    ]);

    const users = await Promise.all(
        initialUsers.map(async ({ name, email, password }) => ({
            user_name: name,
            email,
            password: await bcrypt.hash(password, 4),
        }))
    );

    await prisma.user.createMany({ data: users });
});

describe("POST /api/users/register", () => {
    test("Creates a user in the test database", async () => {
        const newUser = {
            user_name: "Diego Test",
            email: "diego@example.test",
            password: "DiegoTest123!",
        };

        const response = await request(app)
            .post("/api/users/register")
            .send(newUser);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual({
            userName: newUser.user_name,
            email: newUser.email,
        });

        const savedUser = await prisma.user.findUnique({
            where: { email: newUser.email },
        });
        expect(savedUser).not.toBeNull();
        expect(savedUser?.password).not.toBe(newUser.password);
    });

    test("Rejects an email that is already registered", async () => {
        const response = await request(app).post("/api/users/register").send({
            user_name: "Another User",
            email: initialUsers[0].email,
            password: "AnotherUser123!",
        });

        expect(response.status).toBe(409);
        expect(response.body.data).toBe("El email ya está registrado");
    });

    test("Rejects an invalid email", async () => {
        const response = await request(app).post("/api/users/register").send({
            user_name: "Invalid Email User",
            email: "invalid-email",
            password: "ValidPassword123!",
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(true);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: "email",
                    msg: "Email inválido",
                }),
            ])
        );
    });

    test("Rejects an invalid password", async () => {
        const response = await request(app).post("/api/users/register").send({
            user_name: "Invalid Password User",
            email: "invalid-password@example.test",
            password: "short",
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(true);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: "password",
                    msg: "La contraseña debe tener entre 8 y 72 caracteres",
                }),
            ])
        );
    });

    test("Rejects a request with missing required fields", async () => {
        const response = await request(app)
            .post("/api/users/register")
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(true);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "email" }),
                expect.objectContaining({ path: "user_name" }),
                expect.objectContaining({ path: "password" }),
            ])
        );
    });
});

describe("POST /api/users/login", () => {
    test("Returns access and refresh tokens for valid credentials", async () => {
        const user = initialUsers[0];
        const response = await request(app).post("/api/users/login").send({
            email: user.email,
            password: user.password,
        });

        expect(response.status).toBe(201);
        expect(response.headers["x-access-token"]).toEqual(expect.any(String));
        expect(response.headers["x-refresh-token"]).toEqual(expect.any(String));
        expect(response.body.data).toMatchObject({
            user: user.email,
            userName: user.name,
        });
    });

    test("Rejects an incorrect password", async () => {
        const response = await request(app).post("/api/users/login").send({
            email: initialUsers[0].email,
            password: "IncorrectPassword123!",
        });

        expect(response.status).toBe(401);
        expect(response.body.data).toBe("Credenciales inválidas");
    });

    test("Rejects a user that does not exist", async () => {
        const response = await request(app).post("/api/users/login").send({
            email: "missing-user@example.test",
            password: "ValidPassword123!",
        });

        expect(response.status).toBe(401);
        expect(response.body.data).toBe("Credenciales inválidas");
    });

    test("Rejects an invalid request body", async () => {
        const response = await request(app)
            .post("/api/users/login")
            .send({ email: "invalid-email" });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(true);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "email" }),
                expect.objectContaining({ path: "password" }),
            ])
        );
    });
});

describe("POST /api/users/refresh", () => {
    test("Generates new access and refresh tokens", async () => {
        const user = initialUsers[0];
        const loginResponse = await request(app)
            .post("/api/users/login")
            .send({ email: user.email, password: user.password });
        const currentRefreshToken = loginResponse.headers["x-refresh-token"];

        const response = await request(app)
            .post("/api/users/refresh")
            .set("x-refresh-token", currentRefreshToken);

        expect(response.status).toBe(201);
        expect(response.headers["x-access-token"]).toEqual(expect.any(String));
        expect(response.headers["x-refresh-token"]).toEqual(expect.any(String));
        expect(response.headers["x-refresh-token"]).not.toBe(
            currentRefreshToken
        );
    });

    test("Rejects a missing refresh token", async () => {
        const response = await request(app).post("/api/users/refresh");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Refresh no proporcionado",
        });
    });

    test("Rejects an expired refresh token", async () => {
        const expiredRefreshToken = jwt.sign(
            { userId: 1 },
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: -1 }
        );

        const response = await request(app)
            .post("/api/users/refresh")
            .set("x-refresh-token", expiredRefreshToken);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Token refresh invalido o expirado",
        });
    });
});

describe("POST /api/users/logout", () => {
    test("Invalidates the refresh token", async () => {
        const user = initialUsers[0];
        const loginResponse = await request(app)
            .post("/api/users/login")
            .send({ email: user.email, password: user.password });
        const refreshToken = loginResponse.headers["x-refresh-token"];

        const logoutResponse = await request(app)
            .post("/api/users/logout")
            .set("x-refresh-token", refreshToken);

        expect(logoutResponse.status).toBe(204);
        expect(await prisma.refreshSession.count()).toBe(0);

        const reuseResponse = await request(app)
            .post("/api/users/refresh")
            .set("x-refresh-token", refreshToken);
        expect(reuseResponse.status).toBe(403);
        expect(reuseResponse.body.data).toBe(
            "Refresh token inválido o reutilizado"
        );
    });

    test("Rejects an invalid refresh token", async () => {
        const response = await request(app)
            .post("/api/users/logout")
            .set("x-refresh-token", "invalid-refresh-token");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Token refresh invalido o expirado",
        });
    });
});

describe("DELETE /api/users/delete/:id", () => {
    test("Allows an authenticated user to delete their account", async () => {
        const user = initialUsers[0];
        const savedUser = await prisma.user.findUniqueOrThrow({
            where: { email: user.email },
        });
        const loginResponse = await request(app)
            .post("/api/users/login")
            .send({ email: user.email, password: user.password });

        const response = await request(app)
            .delete(`/api/users/delete/${savedUser.user_id}`)
            .set("x-access-token", loginResponse.headers["x-access-token"]);

        expect(response.status).toBe(204);
        expect(
            await prisma.user.findUnique({
                where: { user_id: savedUser.user_id },
            })
        ).toBeNull();
    });

    test("Rejects a request without an access token", async () => {
        const user = await prisma.user.findFirstOrThrow();

        const response = await request(app).delete(
            `/api/users/delete/${user.user_id}`
        );

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Token no proporcionado",
        });
    });

    test("Prevents user A from deleting user B", async () => {
        const userA = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[0].email },
        });
        const userB = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[1].email },
        });
        const loginResponse = await request(app).post("/api/users/login").send({
            email: initialUsers[0].email,
            password: initialUsers[0].password,
        });

        const response = await request(app)
            .delete(`/api/users/delete/${userB.user_id}`)
            .set("x-access-token", loginResponse.headers["x-access-token"]);

        expect(response.status).toBe(204);
        expect(
            await prisma.user.findUnique({
                where: { user_id: userA.user_id },
            })
        ).toBeNull();
        expect(
            await prisma.user.findUnique({
                where: { user_id: userB.user_id },
            })
        ).not.toBeNull();
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});
