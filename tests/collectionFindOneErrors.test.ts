import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

const findFirst = jest.fn<() => Promise<unknown>>();
const captureException = jest.fn();

jest.mock("../src/db/db", () => ({
    __esModule: true,
    default: {
        collection: { findFirst },
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

describe("GET /api/collections/collectionId error propagation", () => {
    beforeEach(() => {
        findFirst.mockReset();
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

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: true,
            data: "Error interno del servidor",
        });
        expect(response.text).not.toContain(databaseError.message);
        expect(captureException).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledWith(databaseError);
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
            "Unexpected request error",
            expect.objectContaining({
                error: databaseError,
                method: "GET",
                path: "/api/collections/collectionId?id=11",
                status: 500,
            })
        );
    });
});

describe("GET /api/collections/observability-error", () => {
    beforeEach(() => {
        captureException.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("sends an intentional unexpected error through observability", async () => {
        const response = await request(app)
            .get("/api/collections/observability-error")
            .set("x-access-token", accessToken);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: true,
            data: "Error interno del servidor",
        });
        expect(response.text).not.toContain(
            "Intentional Sentry verification error"
        );
        expect(captureException).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledTimes(1);
    });
});
