import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import request, { Response } from "supertest";
import jwt from "jsonwebtoken";

const userFindUnique = jest.fn<() => Promise<unknown>>();
const collectionFindFirst = jest.fn<() => Promise<unknown>>();
const postCreate = jest.fn<() => Promise<unknown>>();
const postFindFirst = jest.fn<() => Promise<unknown>>();
const postUpdate = jest.fn<() => Promise<unknown>>();
const postCount = jest.fn<() => Promise<unknown>>();
const postFindMany = jest.fn<() => Promise<unknown>>();
const postDeleteMany = jest.fn<() => Promise<unknown>>();
const captureException = jest.fn();

jest.mock("../src/db/db", () => ({
    __esModule: true,
    default: {
        user: { findUnique: userFindUnique },
        collection: { findFirst: collectionFindFirst },
        post: {
            create: postCreate,
            findFirst: postFindFirst,
            update: postUpdate,
            count: postCount,
            findMany: postFindMany,
            deleteMany: postDeleteMany,
        },
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
                    if (options.shouldHandleError(error))
                        captureException(error);
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

import app from "../src/app";
import logger from "../src/loggers/logger";

const token = jwt.sign({ userId: 7 }, process.env.JWT_SECRET as string, {
    algorithm: "HS256",
});
const postBody = { title: "Post", description: { type: "doc" } };
const auth = (testRequest: request.Test) =>
    testRequest.set("x-access-token", token);

const expectExpected = async (call: Promise<Response>, message: string) => {
    const response = await call;
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ data: message });
    expect(captureException).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
};

const expectUnexpected = async (
    call: Promise<Response>,
    error: Error,
    method: string,
    path: string
) => {
    const response = await call;
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
        expect.objectContaining({ error, method, path, status: 500 })
    );
};

beforeEach(() => {
    for (const mock of [
        userFindUnique,
        collectionFindFirst,
        postCreate,
        postFindFirst,
        postUpdate,
        postCount,
        postFindMany,
        postDeleteMany,
    ])
        mock.mockReset();
    captureException.mockClear();
    jest.mocked(logger.error).mockClear();
});

describe("Posts HTTP migrated error propagation", () => {
    test("create preserves success and handles expected ownership failures", async () => {
        const created = { post_id: 1, user_id: 7, ...postBody };
        userFindUnique.mockResolvedValue({ user_id: 7 });
        collectionFindFirst.mockResolvedValue({ collection_id: 2 });
        postCreate.mockResolvedValue(created);
        const success = await auth(
            request(app).post("/api/post/create?collectionId=2")
        ).send(postBody);
        expect(success.status).toBe(201);
        expect(success.body).toEqual({ data: created });

        userFindUnique.mockResolvedValue(null);
        await expectExpected(
            auth(request(app).post("/api/post/create?collectionId=2")).send(
                postBody
            ),
            "El usuario especificado no existe."
        );

        userFindUnique.mockResolvedValue({ user_id: 7 });
        collectionFindFirst.mockResolvedValue(null);
        await expectExpected(
            auth(request(app).post("/api/post/create?collectionId=2")).send(
                postBody
            ),
            "La colección especificada no existe."
        );
    });

    test("create preserves an unexpected Prisma error", async () => {
        const error = new Error("private create failure");
        userFindUnique.mockResolvedValue({ user_id: 7 });
        collectionFindFirst.mockResolvedValue({ collection_id: 2 });
        postCreate.mockRejectedValue(error);
        await expectUnexpected(
            auth(request(app).post("/api/post/create?collectionId=2")).send(
                postBody
            ),
            error,
            "POST",
            "/api/post/create?collectionId=2"
        );
    });

    test("createOne preserves success and user-not-found behavior", async () => {
        const created = { post_id: 1, user_id: 7, ...postBody };
        userFindUnique.mockResolvedValue({ user_id: 7 });
        postCreate.mockResolvedValue(created);
        const success = await auth(
            request(app).post("/api/post/createOne")
        ).send(postBody);
        expect(success.status).toBe(201);
        expect(success.body).toEqual({ data: created });

        userFindUnique.mockResolvedValue(null);
        await expectExpected(
            auth(request(app).post("/api/post/createOne")).send(postBody),
            "El usuario especificado no existe"
        );
    });

    test("createOne preserves an unexpected Prisma error", async () => {
        const error = new Error("private createOne failure");
        userFindUnique.mockRejectedValue(error);
        await expectUnexpected(
            auth(request(app).post("/api/post/createOne")).send(postBody),
            error,
            "POST",
            "/api/post/createOne"
        );
    });

    test("putInCollection preserves success and expected failures", async () => {
        const updated = { post_id: 1, collection_id: 2 };
        postFindFirst.mockResolvedValue({ post_id: 1 });
        collectionFindFirst.mockResolvedValue({ collection_id: 2 });
        postUpdate.mockResolvedValue(updated);
        const success = await auth(
            request(app).put("/api/post/updateOne?postId=1&collectionId=2")
        );
        expect(success.status).toBe(200);
        expect(success.body).toEqual({ data: updated });

        postFindFirst.mockResolvedValue(null);
        await expectExpected(
            auth(
                request(app).put("/api/post/updateOne?postId=1&collectionId=2")
            ),
            "El post buscado no existe"
        );

        postFindFirst.mockResolvedValue({ post_id: 1 });
        collectionFindFirst.mockResolvedValue(null);
        await expectExpected(
            auth(
                request(app).put("/api/post/updateOne?postId=1&collectionId=2")
            ),
            "Colección no encontrada"
        );
    });

    test("putInCollection preserves an unexpected Prisma error", async () => {
        const error = new Error("private assignment failure");
        postFindFirst.mockRejectedValue(error);
        await expectUnexpected(
            auth(
                request(app).put("/api/post/updateOne?postId=1&collectionId=2")
            ),
            error,
            "PUT",
            "/api/post/updateOne?postId=1&collectionId=2"
        );
    });

    test("onePost never represents an unexpected failure as status 200", async () => {
        const post = { post_id: 1, user_id: 7 };
        postFindFirst.mockResolvedValue(post);
        const success = await auth(
            request(app).get("/api/post/findOne?postId=1")
        );
        expect(success.status).toBe(200);
        expect(success.body).toEqual({ data: post });

        postFindFirst.mockResolvedValue(null);
        await expectExpected(
            auth(request(app).get("/api/post/findOne?postId=1")),
            "Post no encontrado"
        );

        const error = new Error("private find post failure");
        postFindFirst.mockRejectedValue(error);
        await expectUnexpected(
            auth(request(app).get("/api/post/findOne?postId=1")),
            error,
            "GET",
            "/api/post/findOne?postId=1"
        );
    });

    test("getAllPost preserves success, empty pages and user-not-found", async () => {
        userFindUnique.mockResolvedValue({ user_id: 7 });
        postCount.mockResolvedValue(1);
        postFindMany.mockResolvedValue([{ post_id: 1 }]);
        const success = await auth(request(app).get("/api/post/"));
        expect(success.status).toBe(200);
        expect(success.body).toEqual({
            data: { userPost: [{ post_id: 1 }], totalPages: 1 },
        });

        postCount.mockResolvedValue(0);
        postFindMany.mockResolvedValue([]);
        const empty = await auth(request(app).get("/api/post/?page=2"));
        expect(empty.body).toEqual({ data: { userPost: [], totalPages: 0 } });

        userFindUnique.mockResolvedValue(null);
        await expectExpected(
            auth(request(app).get("/api/post/")),
            "Usuario no encontrado"
        );
    });

    test.each([
        ["count", postCount],
        ["findMany", postFindMany],
    ])(
        "getAllPost preserves an unexpected %s error",
        async (_name, failingMock) => {
            const error = new Error("private list failure");
            userFindUnique.mockResolvedValue({ user_id: 7 });
            postCount.mockResolvedValue(1);
            failingMock.mockRejectedValue(error);
            await expectUnexpected(
                auth(request(app).get("/api/post/")),
                error,
                "GET",
                "/api/post/"
            );
        }
    );

    test("deletePost preserves 204 without body and expected 404", async () => {
        postDeleteMany.mockResolvedValue({ count: 1 });
        const success = await auth(
            request(app).delete("/api/post/deletePost?postId=1")
        );
        expect(success.status).toBe(204);
        expect(success.text).toBe("");

        postDeleteMany.mockResolvedValue({ count: 0 });
        await expectExpected(
            auth(request(app).delete("/api/post/deletePost?postId=1")),
            "Post no encontrado"
        );
    });

    test("deletePost preserves an unexpected Prisma error", async () => {
        const error = new Error("private delete failure");
        postDeleteMany.mockRejectedValue(error);
        await expectUnexpected(
            auth(request(app).delete("/api/post/deletePost?postId=1")),
            error,
            "DELETE",
            "/api/post/deletePost?postId=1"
        );
    });
});
