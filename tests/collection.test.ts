import { initialUsers, initPost } from "./helpers/helperTest";
import { assertTestDatabase } from "./helpers/testDatabase";
import { afterAll, beforeEach, describe, expect, test } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcrypt";
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

    const [userA, userB] = await Promise.all(
        initialUsers
            .slice(0, 2)
            .map(({ email }) =>
                prisma.user.findUniqueOrThrow({ where: { email } })
            )
    );

    await prisma.collection.createMany({
        data: [userA, userB].map((user, index) => ({
            collection_name: `User ${index ? "B" : "A"} collection`,
            title: `User ${index ? "B" : "A"} collection`,
            user_id: user.user_id,
        })),
    });
});

const login = async (userIndex = 0) => {
    const user = initialUsers[userIndex];
    const response = await request(app).post("/api/users/login").send({
        email: user.email,
        password: user.password,
    });
    return response.headers["x-access-token"] as string;
};

const findCollection = (userIndex = 0) =>
    prisma.collection.findFirstOrThrow({
        where: { user: { email: initialUsers[userIndex].email } },
    });

describe("POST /api/collections/createCollection", () => {
    test("Creates a collection", async () => {
        const accessToken = await login();
        const body = {
            collectionName: "Personal notes",
            title: "Personal notes",
        };
        const response = await request(app)
            .post("/api/collections/createCollection")
            .set("x-access-token", accessToken)
            .send(body);

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({
            collection_name: body.collectionName,
            title: body.title,
        });
    });

    test("Rejects a request without authentication", async () => {
        const response = await request(app)
            .post("/api/collections/createCollection")
            .send({ collectionName: "Notes", title: "Notes" });
        expect(response.status).toBe(401);
    });

    test("Rejects an empty or invalid name", async () => {
        const response = await request(app)
            .post("/api/collections/createCollection")
            .set("x-access-token", await login())
            .send({ collectionName: "   ", title: "" });

        expect(response.status).toBe(400);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "collectionName" }),
                expect.objectContaining({ path: "title" }),
            ])
        );
    });
});

describe("GET /api/collections/allCollections", () => {
    test("Returns only collections owned by the authenticated user", async () => {
        const user = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[0].email },
        });
        const response = await request(app)
            .get("/api/collections/allCollections")
            .set("x-access-token", await login());

        expect(response.status).toBe(200);
        expect(response.body.data.collectionList).toHaveLength(1);
        expect(response.body.data.collectionList[0].user_id).toBe(user.user_id);
    });

    test("Paginates collections", async () => {
        const user = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[0].email },
        });
        await prisma.collection.createMany({
            data: Array.from({ length: 20 }, (_, index) => ({
                collection_name: `Collection ${index + 1}`,
                title: `Collection ${index + 1}`,
                user_id: user.user_id,
            })),
        });
        const accessToken = await login();
        const firstPage = await request(app)
            .get("/api/collections/allCollections?page=1")
            .set("x-access-token", accessToken);
        const secondPage = await request(app)
            .get("/api/collections/allCollections?page=2")
            .set("x-access-token", accessToken);

        expect(firstPage.body.data.collectionList).toHaveLength(20);
        expect(firstPage.body.data.totalPages).toBe(2);
        expect(secondPage.body.data.collectionList).toHaveLength(1);
    });
});

describe("GET /api/collections/collectionId", () => {
    test("Returns a collection by ID", async () => {
        const collection = await findCollection();
        const response = await request(app)
            .get(`/api/collections/collectionId?id=${collection.collection_id}`)
            .set("x-access-token", await login());

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({
            collection_id: collection.collection_id,
            title: collection.title,
        });
        expect(response.body.data).toHaveProperty("posts");
    });

    test("Prevents access to another user's collection", async () => {
        const collection = await findCollection(1);
        const response = await request(app)
            .get(`/api/collections/collectionId?id=${collection.collection_id}`)
            .set("x-access-token", await login());

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("Colección no encontrada");
    });
});

describe("PUT /api/collections/updateCollection", () => {
    test("Updates a collection title", async () => {
        const collection = await findCollection();
        const response = await request(app)
            .put("/api/collections/updateCollection")
            .set("x-access-token", await login())
            .send({
                collectionId: collection.collection_id,
                title: "Updated collection",
            });

        expect(response.status).toBe(200);
        expect(
            await prisma.collection.findUniqueOrThrow({
                where: { collection_id: collection.collection_id },
            })
        ).toMatchObject({ title: "Updated collection" });
    });

    test("Prevents updating another user's collection", async () => {
        const collection = await findCollection(1);
        const response = await request(app)
            .put("/api/collections/updateCollection")
            .set("x-access-token", await login())
            .send({
                collectionId: collection.collection_id,
                title: "Unauthorized",
            });

        expect(response.status).toBe(400);
        expect(response.body.data).toBe("Colección no encontrada");
        expect(
            await prisma.collection.findUniqueOrThrow({
                where: { collection_id: collection.collection_id },
            })
        ).toMatchObject({ title: collection.title });
    });
});

describe("DELETE /api/collections/deteleCollection", () => {
    test("Deletes a collection", async () => {
        const collection = await findCollection();
        const response = await request(app)
            .delete(
                `/api/collections/deteleCollection?id=${collection.collection_id}`
            )
            .set("x-access-token", await login());

        expect(response.status).toBe(204);
        expect(
            await prisma.collection.findUnique({
                where: { collection_id: collection.collection_id },
            })
        ).toBeNull();
    });

    test("Keeps posts without a collection when their collection is deleted", async () => {
        const collection = await findCollection();
        const user = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[0].email },
        });
        const post = await prisma.post.create({
            data: {
                ...initPost[0],
                user_id: user.user_id,
                collection_id: collection.collection_id,
            },
        });
        const response = await request(app)
            .delete(
                `/api/collections/deteleCollection?id=${collection.collection_id}`
            )
            .set("x-access-token", await login());

        expect(response.status).toBe(204);
        expect(
            await prisma.post.findUniqueOrThrow({
                where: { post_id: post.post_id },
            })
        ).toMatchObject({ collection_id: null });
    });

    test("Prevents deleting another user's collection", async () => {
        const collection = await findCollection(1);
        const response = await request(app)
            .delete(
                `/api/collections/deteleCollection?id=${collection.collection_id}`
            )
            .set("x-access-token", await login());

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("No se encontró la colección");
        expect(
            await prisma.collection.findUnique({
                where: { collection_id: collection.collection_id },
            })
        ).not.toBeNull();
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});
