import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import request, { Response } from "supertest";
import jwt from "jsonwebtoken";

const findFirst = jest.fn<() => Promise<unknown>>();
const create = jest.fn<() => Promise<unknown>>();
const updateMany = jest.fn<() => Promise<unknown>>();
const deleteMany = jest.fn<() => Promise<unknown>>();
const count = jest.fn<() => Promise<unknown>>();
const findMany = jest.fn<() => Promise<unknown>>();
const captureException = jest.fn();

jest.mock("../src/db/db", () => ({
    __esModule: true,
    default: {
        collection: {
            findFirst,
            create,
            updateMany,
            deleteMany,
            count,
            findMany,
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
    default: {
        error: jest.fn(),
    },
}));

import app from "../src/app";
import logger from "../src/loggers/logger";

const accessToken = jwt.sign({ userId: 7 }, process.env.JWT_SECRET as string, {
    algorithm: "HS256",
});

const getCollection = () =>
    request(app)
        .get("/api/collections/collectionId?id=11")
        .set("x-access-token", accessToken);

const expectUnexpectedError = (
    response: Response,
    error: Error,
    method: string,
    path: string
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
        expect.objectContaining({ error, method, path, status: 500 })
    );
};

describe("GET /api/collections/collectionId error propagation", () => {
    beforeEach(() => {
        findFirst.mockReset();
        create.mockReset();
        updateMany.mockReset();
        deleteMany.mockReset();
        count.mockReset();
        findMany.mockReset();
        captureException.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("preserves the successful response contract", async () => {
        const collection = {
            collection_id: 11,
            collection_name: "Journal",
            title: "Journal",
            user_id: 7,
            posts: [],
        };
        findFirst.mockResolvedValue(collection);

        const response = await getCollection();

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ data: collection });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("returns a safe 404 without reporting an expected error", async () => {
        findFirst.mockResolvedValue(null);

        const response = await getCollection();

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ data: "Colección no encontrada" });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("reports an unexpected database error and returns a generic 500", async () => {
        const databaseError = new Error("database unavailable");
        findFirst.mockRejectedValue(databaseError);

        const response = await getCollection();

        expectUnexpectedError(
            response,
            databaseError,
            "GET",
            "/api/collections/collectionId?id=11"
        );
    });
});

describe("remaining Collections error propagation", () => {
    beforeEach(() => {
        findFirst.mockReset();
        create.mockReset();
        updateMany.mockReset();
        deleteMany.mockReset();
        count.mockReset();
        findMany.mockReset();
        captureException.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("preserves the create success contract", async () => {
        const collection = { collection_id: 12, title: "Notes", user_id: 7 };
        create.mockResolvedValue(collection);

        const validResponse = await request(app)
            .post("/api/collections/createCollection")
            .set("x-access-token", accessToken)
            .send({ collectionName: "Notes", title: "Notes" });

        expect(validResponse.status).toBe(201);
        expect(validResponse.body).toEqual({ data: collection });
    });

    test("preserves the update success contract", async () => {
        updateMany.mockResolvedValue({ count: 1 });

        const response = await request(app)
            .put("/api/collections/updateCollection")
            .set("x-access-token", accessToken)
            .send({ collectionId: 11, title: "Updated" });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ data: { count: 1 } });
    });

    test("keeps update not found as an expected 400", async () => {
        updateMany.mockResolvedValue({ count: 0 });

        const response = await request(app)
            .put("/api/collections/updateCollection")
            .set("x-access-token", accessToken)
            .send({ collectionId: 11, title: "Updated" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ data: "Colección no encontrada" });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("preserves the delete 204 contract without a body", async () => {
        findFirst.mockResolvedValue({ collection_id: 11, user_id: 7 });
        deleteMany.mockResolvedValue({ count: 1 });

        const response = await request(app)
            .delete("/api/collections/deleteCollection?id=11")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(204);
        expect(response.text).toBe("");
    });

    test("reports delete not found as an expected 404", async () => {
        findFirst.mockResolvedValue(null);

        const response = await request(app)
            .delete("/api/collections/deleteCollection?id=11")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ data: "No se encontró la colección" });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("preserves the list success contract", async () => {
        const collectionList = [{ collection_id: 11, user_id: 7 }];
        count.mockResolvedValue(1);
        findMany.mockResolvedValue(collectionList);

        const response = await request(app)
            .get("/api/collections/allCollections")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            data: { collectionList, totalPages: 1 },
        });
    });

    test.each([
        {
            name: "create",
            method: "POST",
            path: "/api/collections/createCollection",
            arrange: (error: Error) => create.mockRejectedValue(error),
            call: () =>
                request(app)
                    .post("/api/collections/createCollection")
                    .set("x-access-token", accessToken)
                    .send({ collectionName: "Notes", title: "Notes" }),
        },
        {
            name: "update",
            method: "PUT",
            path: "/api/collections/updateCollection",
            arrange: (error: Error) => updateMany.mockRejectedValue(error),
            call: () =>
                request(app)
                    .put("/api/collections/updateCollection")
                    .set("x-access-token", accessToken)
                    .send({ collectionId: 11, title: "Updated" }),
        },
        {
            name: "delete lookup",
            method: "DELETE",
            path: "/api/collections/deleteCollection?id=11",
            arrange: (error: Error) => findFirst.mockRejectedValue(error),
            call: () =>
                request(app)
                    .delete("/api/collections/deleteCollection?id=11")
                    .set("x-access-token", accessToken),
        },
        {
            name: "delete mutation",
            method: "DELETE",
            path: "/api/collections/deleteCollection?id=11",
            arrange: (error: Error) => {
                findFirst.mockResolvedValue({ collection_id: 11, user_id: 7 });
                deleteMany.mockRejectedValue(error);
            },
            call: () =>
                request(app)
                    .delete("/api/collections/deleteCollection?id=11")
                    .set("x-access-token", accessToken),
        },
        {
            name: "list count",
            method: "GET",
            path: "/api/collections/allCollections",
            arrange: (error: Error) => count.mockRejectedValue(error),
            call: () =>
                request(app)
                    .get("/api/collections/allCollections")
                    .set("x-access-token", accessToken),
        },
        {
            name: "list query",
            method: "GET",
            path: "/api/collections/allCollections",
            arrange: (error: Error) => {
                count.mockResolvedValue(1);
                findMany.mockRejectedValue(error);
            },
            call: () =>
                request(app)
                    .get("/api/collections/allCollections")
                    .set("x-access-token", accessToken),
        },
    ])(
        "preserves and reports an unexpected Prisma error from $name",
        async ({ method, path, arrange, call }) => {
            const databaseError = new Error("private Prisma failure");
            arrange(databaseError);

            const response = await call();

            expectUnexpectedError(response, databaseError, method, path);
        }
    );

    test("the removed preview endpoint is no longer registered", async () => {
        const response = await request(app)
            .get("/api/collections/observability-error")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: "Route GET /api/collections/observability-error Not Found",
        });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });
});
