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

    const user = await prisma.user.findUniqueOrThrow({
        where: { email: initialUsers[0].email },
    });

    const collection = await prisma.collection.create({
        data: {
            collection_name: "Test collection",
            title: "Test collection",
            user_id: user.user_id,
        },
    });

    await prisma.post.createMany({
        data: initPost.map(({ title, description }) => ({
            title,
            description,
            user_id: user.user_id,
            collection_id: collection.collection_id,
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

describe("POST /api/post/create", () => {
    test("Creates a post inside a valid collection", async () => {
        const accessToken = await login();
        const collection = await prisma.collection.findFirstOrThrow({
            where: { user: { email: initialUsers[0].email } },
        });
        const post = initPost[0];

        const response = await request(app)
            .post(`/api/post/create?collectionId=${collection.collection_id}`)
            .set("x-access-token", accessToken)
            .send(post);

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({
            title: post.title,
            description: post.description,
            collection_id: collection.collection_id,
        });
    });

    test("Rejects a request without an access token", async () => {
        const collection = await prisma.collection.findFirstOrThrow();

        const response = await request(app)
            .post(`/api/post/create?collectionId=${collection.collection_id}`)
            .send(initPost[0]);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Token no proporcionado",
        });
    });

    test("Rejects a collection that does not exist", async () => {
        const accessToken = await login();

        const response = await request(app)
            .post("/api/post/create?collectionId=999999")
            .set("x-access-token", accessToken)
            .send(initPost[0]);

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("La colección especificada no existe.");
    });

    test("Rejects a collection owned by another user", async () => {
        const accessToken = await login();
        const otherUser = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[1].email },
        });
        const otherCollection = await prisma.collection.create({
            data: {
                collection_name: "Other user's collection",
                title: "Other user's collection",
                user_id: otherUser.user_id,
            },
        });

        const response = await request(app)
            .post(
                `/api/post/create?collectionId=${otherCollection.collection_id}`
            )
            .set("x-access-token", accessToken)
            .send(initPost[0]);

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("La colección especificada no existe.");
    });

    test("Rejects a body without a title", async () => {
        const accessToken = await login();
        const collection = await prisma.collection.findFirstOrThrow();

        const response = await request(app)
            .post(`/api/post/create?collectionId=${collection.collection_id}`)
            .set("x-access-token", accessToken)
            .send({ description: initPost[0].description });

        expect(response.status).toBe(400);
        expect(response.body.data).toEqual(
            expect.arrayContaining([expect.objectContaining({ path: "title" })])
        );
    });

    test("Rejects an invalid body", async () => {
        const accessToken = await login();
        const collection = await prisma.collection.findFirstOrThrow();

        const response = await request(app)
            .post(`/api/post/create?collectionId=${collection.collection_id}`)
            .set("x-access-token", accessToken)
            .send({ title: 123, description: null });

        expect(response.status).toBe(400);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "title" }),
                expect.objectContaining({ path: "description" }),
            ])
        );
    });
});

describe("POST /api/post/createOne", () => {
    test("Creates a post successfully", async () => {
        const accessToken = await login();

        const response = await request(app)
            .post("/api/post/createOne")
            .set("x-access-token", accessToken)
            .send(initPost[0]);

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({
            title: initPost[0].title,
            description: initPost[0].description,
        });
    });

    test("Associates the post with the authenticated user", async () => {
        const accessToken = await login();
        const user = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[0].email },
        });

        const response = await request(app)
            .post("/api/post/createOne")
            .set("x-access-token", accessToken)
            .send(initPost[0]);
        const post = await prisma.post.findUniqueOrThrow({
            where: { post_id: response.body.data.post_id },
        });

        expect(post.user_id).toBe(user.user_id);
    });

    test("Does not associate the post with a collection", async () => {
        const accessToken = await login();

        const response = await request(app)
            .post("/api/post/createOne")
            .set("x-access-token", accessToken)
            .send(initPost[0]);
        const post = await prisma.post.findUniqueOrThrow({
            where: { post_id: response.body.data.post_id },
        });

        expect(post.collection_id).toBeNull();
    });

    test("Rejects a request without an access token", async () => {
        const response = await request(app)
            .post("/api/post/createOne")
            .send(initPost[0]);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Token no proporcionado",
        });
    });
});

describe("PUT /api/post/updateOne", () => {
    const createPostWithoutCollection = async (userIndex = 0) => {
        const user = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[userIndex].email },
        });

        return prisma.post.create({
            data: {
                ...initPost[0],
                user_id: user.user_id,
            },
        });
    };

    test("Assigns a post without a collection to a collection", async () => {
        const accessToken = await login();
        const post = await createPostWithoutCollection();
        const collection = await prisma.collection.findFirstOrThrow();

        const response = await request(app)
            .put(
                `/api/post/updateOne?postId=${post.post_id}&collectionId=${collection.collection_id}`
            )
            .set("x-access-token", accessToken);

        expect(response.status).toBe(200);
        expect(response.body.data.collection_id).toBe(collection.collection_id);
        expect(
            await prisma.post.findUniqueOrThrow({
                where: { post_id: post.post_id },
            })
        ).toMatchObject({ collection_id: collection.collection_id });
    });

    test("Rejects a post that does not exist", async () => {
        const accessToken = await login();
        const collection = await prisma.collection.findFirstOrThrow();

        const response = await request(app)
            .put(
                `/api/post/updateOne?postId=999999&collectionId=${collection.collection_id}`
            )
            .set("x-access-token", accessToken);

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("El post buscado no existe");
    });

    test("Rejects a collection that does not exist", async () => {
        const accessToken = await login();
        const post = await createPostWithoutCollection();

        const response = await request(app)
            .put(
                `/api/post/updateOne?postId=${post.post_id}&collectionId=999999`
            )
            .set("x-access-token", accessToken);

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("Colección no encontrada");
    });

    test("Rejects modifying another user's post", async () => {
        const accessToken = await login();
        const otherUserPost = await createPostWithoutCollection(1);
        const collection = await prisma.collection.findFirstOrThrow();

        const response = await request(app)
            .put(
                `/api/post/updateOne?postId=${otherUserPost.post_id}&collectionId=${collection.collection_id}`
            )
            .set("x-access-token", accessToken);

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("El post buscado no existe");
        expect(
            await prisma.post.findUniqueOrThrow({
                where: { post_id: otherUserPost.post_id },
            })
        ).toMatchObject({ collection_id: null });
    });
});

describe("PUT /api/post/autosave", () => {
    const findUserPost = async () => {
        return prisma.post.findFirstOrThrow({
            where: { user: { email: initialUsers[0].email } },
        });
    };

    test("Updates the title", async () => {
        const accessToken = await login();
        const post = await findUserPost();

        const response = await request(app)
            .put(`/api/post/autosave?postId=${post.post_id}`)
            .set("x-access-token", accessToken)
            .send({ title: "Updated journal title" });

        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe("Updated journal title");
    });

    test("Updates the description", async () => {
        const accessToken = await login();
        const post = await findUserPost();
        const description = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Autosaved content" }],
                },
            ],
        };

        const response = await request(app)
            .put(`/api/post/autosave?postId=${post.post_id}`)
            .set("x-access-token", accessToken)
            .send({ description });

        expect(response.status).toBe(200);
        expect(response.body.data.description).toEqual(description);
    });

    test("Keeps fields that were not modified", async () => {
        const accessToken = await login();
        const post = await findUserPost();

        await request(app)
            .put(`/api/post/autosave?postId=${post.post_id}`)
            .set("x-access-token", accessToken)
            .send({ title: "Only the title changed" });
        const updatedPost = await prisma.post.findUniqueOrThrow({
            where: { post_id: post.post_id },
        });

        expect(updatedPost.title).toBe("Only the title changed");
        expect(updatedPost.description).toEqual(post.description);
        expect(updatedPost.collection_id).toBe(post.collection_id);
    });

    test("Rejects a post that does not exist", async () => {
        const accessToken = await login();

        const response = await request(app)
            .put("/api/post/autosave?postId=999999")
            .set("x-access-token", accessToken)
            .send({ title: "Updated title" });

        expect(response.status).toBe(404);
        expect(response.body.data).toBe(
            "Post no encontrado para el usuario autenticado."
        );
    });

    test("Rejects an invalid body", async () => {
        const accessToken = await login();
        const post = await findUserPost();

        const response = await request(app)
            .put(`/api/post/autosave?postId=${post.post_id}`)
            .set("x-access-token", accessToken)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.data).toBe(
            "No se proporcionó ningún campo para actualizar."
        );
    });

    test("Rejects editing another user's post", async () => {
        const accessToken = await login();
        const otherUser = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[1].email },
        });
        const otherUserPost = await prisma.post.create({
            data: { ...initPost[0], user_id: otherUser.user_id },
        });

        const response = await request(app)
            .put(`/api/post/autosave?postId=${otherUserPost.post_id}`)
            .set("x-access-token", accessToken)
            .send({ title: "Unauthorized update" });

        expect(response.status).toBe(404);
        expect(response.body.data).toBe(
            "Post no encontrado para el usuario autenticado."
        );
        expect(
            await prisma.post.findUniqueOrThrow({
                where: { post_id: otherUserPost.post_id },
            })
        ).toMatchObject({ title: initPost[0].title });
    });

    test("Rejects a request without an access token", async () => {
        const post = await findUserPost();

        const response = await request(app)
            .put(`/api/post/autosave?postId=${post.post_id}`)
            .send({ title: "Unauthorized update" });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Token no proporcionado",
        });
    });
});

describe("GET /api/post/findOne", () => {
    test("Returns the requested post", async () => {
        const accessToken = await login();
        const post = await prisma.post.findFirstOrThrow({
            where: { user: { email: initialUsers[0].email } },
        });

        const response = await request(app)
            .get(`/api/post/findOne?postId=${post.post_id}`)
            .set("x-access-token", accessToken);

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({
            post_id: post.post_id,
            title: post.title,
            description: post.description,
            user_id: post.user_id,
        });
    });

    test("Rejects a post that does not exist", async () => {
        const accessToken = await login();

        const response = await request(app)
            .get("/api/post/findOne?postId=999999")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("Post no encontrado");
    });

    test("Prevents user A from accessing user B's post", async () => {
        const accessToken = await login();
        const otherUser = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[1].email },
        });
        const otherUserPost = await prisma.post.create({
            data: { ...initPost[0], user_id: otherUser.user_id },
        });

        const response = await request(app)
            .get(`/api/post/findOne?postId=${otherUserPost.post_id}`)
            .set("x-access-token", accessToken);

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("Post no encontrado");
    });

    test("Rejects an invalid post ID", async () => {
        const accessToken = await login();

        const response = await request(app)
            .get("/api/post/findOne?postId=invalid")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(true);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "postId" }),
            ])
        );
    });
});

describe("GET /api/post/", () => {
    test("Returns only posts owned by the authenticated user", async () => {
        const accessToken = await login();
        const authenticatedUser = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[0].email },
        });
        const otherUser = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[1].email },
        });
        await prisma.post.create({
            data: { ...initPost[0], user_id: otherUser.user_id },
        });

        const response = await request(app)
            .get("/api/post/")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(200);
        expect(response.body.data.userPost).toHaveLength(initPost.length);
        expect(
            response.body.data.userPost.every(
                (post: { user_id: number }) =>
                    post.user_id === authenticatedUser.user_id
            )
        ).toBe(true);
    });

    test("Paginates posts", async () => {
        const accessToken = await login();
        const user = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[0].email },
        });
        await prisma.post.createMany({
            data: Array.from({ length: 18 }, (_, index) => ({
                ...initPost[0],
                title: `Pagination post ${index + 1}`,
                user_id: user.user_id,
            })),
        });

        const firstPage = await request(app)
            .get("/api/post/?page=1")
            .set("x-access-token", accessToken);
        const secondPage = await request(app)
            .get("/api/post/?page=2")
            .set("x-access-token", accessToken);

        expect(firstPage.status).toBe(200);
        expect(firstPage.body.data.userPost).toHaveLength(20);
        expect(firstPage.body.data.totalPages).toBe(2);
        expect(secondPage.body.data.userPost).toHaveLength(1);
        expect(secondPage.body.data.totalPages).toBe(2);
    });

    test("Returns an empty array for an empty page", async () => {
        const accessToken = await login();

        const response = await request(app)
            .get("/api/post/?page=2")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(200);
        expect(response.body.data.userPost).toEqual([]);
        expect(response.body.data.totalPages).toBe(1);
    });

    test("Rejects invalid pagination parameters", async () => {
        const accessToken = await login();

        const response = await request(app)
            .get("/api/post/?page=0&orderField=invalid&orderDirection=invalid")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(true);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "page" }),
                expect.objectContaining({ path: "orderField" }),
                expect.objectContaining({ path: "orderDirection" }),
            ])
        );
    });

    test("Includes collections in the response", async () => {
        const accessToken = await login();

        const response = await request(app)
            .get("/api/post/")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(200);
        expect(response.body.data.userPost).not.toHaveLength(0);
        expect(response.body.data.userPost[0]).toHaveProperty("collection");
        expect(response.body.data.userPost[0].collection).toMatchObject({
            collection_name: "Test collection",
            title: "Test collection",
        });
    });
});

describe("DELETE /api/post/deletePost", () => {
    test("Deletes a post", async () => {
        const accessToken = await login();
        const post = await prisma.post.findFirstOrThrow({
            where: { user: { email: initialUsers[0].email } },
        });

        const response = await request(app)
            .delete(`/api/post/deletePost?postId=${post.post_id}`)
            .set("x-access-token", accessToken);

        expect(response.status).toBe(204);
        expect(
            await prisma.post.findUnique({
                where: { post_id: post.post_id },
            })
        ).toBeNull();
    });

    test("Deletes only posts owned by the authenticated user", async () => {
        const accessToken = await login();
        const otherUser = await prisma.user.findUniqueOrThrow({
            where: { email: initialUsers[1].email },
        });
        const otherUserPost = await prisma.post.create({
            data: { ...initPost[0], user_id: otherUser.user_id },
        });

        const response = await request(app)
            .delete(`/api/post/deletePost?postId=${otherUserPost.post_id}`)
            .set("x-access-token", accessToken);

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("Post no encontrado");
        expect(
            await prisma.post.findUnique({
                where: { post_id: otherUserPost.post_id },
            })
        ).not.toBeNull();
    });

    test("Rejects a post that does not exist", async () => {
        const accessToken = await login();

        const response = await request(app)
            .delete("/api/post/deletePost?postId=999999")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(404);
        expect(response.body.data).toBe("Post no encontrado");
    });

    test("Rejects a request without an access token", async () => {
        const post = await prisma.post.findFirstOrThrow();

        const response = await request(app).delete(
            `/api/post/deletePost?postId=${post.post_id}`
        );

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: true,
            data: "Token no proporcionado",
        });
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});
