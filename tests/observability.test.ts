import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import request from "supertest";

const captureException = jest.fn();

jest.mock("@sentry/node", () => ({
    init: jest.fn(),
    setupExpressErrorHandler: jest.fn(
        (app: { use: (middleware: unknown) => void }) => {
            app.use(
                (
                    error: unknown,
                    _req: unknown,
                    _res: unknown,
                    next: (error: unknown) => void
                ) => {
                    captureException(error);
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

describe("observability error boundary", () => {
    beforeEach(() => {
        captureException.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("captures and logs unexpected errors without exposing details", async () => {
        const response = await request(app).get(
            "/__test/observability-error"
        );

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: true,
            data: "Error interno del servidor",
        });
        expect(response.text).not.toContain("Observability test error");
        expect(captureException).toHaveBeenCalledWith(expect.any(Error));
        expect(logger.error).toHaveBeenCalledWith(
            "Unexpected request error",
            expect.objectContaining({
                error: expect.any(Error),
                method: "GET",
                path: "/__test/observability-error",
                status: 500,
            })
        );
    });
});
