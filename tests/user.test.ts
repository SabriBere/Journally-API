import { initialUsers } from "./helpers/helperTest";
import { assertTestDatabase } from "./helpers/testDatabase";
import { afterAll, beforeEach, describe, expect, test } from "@jest/globals";
import request from "supertest";
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

    await prisma.user.createMany({
        data: initialUsers.map(({ name, email, password }) => ({
            user_name: name,
            email,
            password,
        })),
    });
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
});

afterAll(async () => {
    await prisma.$disconnect();
});
