import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import express from "express";
import request from "supertest";

const captureException = jest.fn();
const sentryLogInfo = jest.fn();
const sentryLogWarn = jest.fn();

jest.mock("@sentry/node", () => ({
    init: jest.fn(),
    logger: {
        info: sentryLogInfo,
        warn: sentryLogWarn,
    },
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
import AppError from "../src/errors/AppError";
import logger from "../src/loggers/logger";
import observabilityLogger from "../src/loggers/observabilityLogger";
import { setupSentryErrorHandler } from "../src/loggers/sentry";
import errorHandler from "../src/middlewares/errorHandler";

const createBoundaryApp = (error: Error) => {
    const boundaryApp = express();
    boundaryApp.get("/error", () => {
        throw error;
    });
    setupSentryErrorHandler(boundaryApp);
    boundaryApp.use(errorHandler);
    return boundaryApp;
};

describe("observability error boundary", () => {
    beforeEach(() => {
        captureException.mockClear();
        sentryLogInfo.mockClear();
        sentryLogWarn.mockClear();
        jest.mocked(logger.error).mockClear();
    });

    test("captures and logs unexpected errors without exposing details", async () => {
        const response = await request(app).get("/__test/observability-error");

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
        expect(sentryLogInfo).not.toHaveBeenCalled();
        expect(sentryLogWarn).not.toHaveBeenCalled();
    });

    test("returns 400 for malformed JSON without reporting it", async () => {
        const response = await request(app)
            .post("/api/users/login")
            .set("Content-Type", "application/json")
            .send('{"email":');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            data: "El cuerpo de la solicitud contiene JSON inválido",
        });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("returns 413 for a payload over the configured limit without reporting it", async () => {
        const response = await request(app)
            .post("/api/users/login")
            .set("Content-Type", "application/json")
            .send({ payload: "x".repeat(101 * 1024) });

        expect(response.status).toBe(413);
        expect(response.body).toEqual({
            data: "El cuerpo de la solicitud supera el tamaño permitido",
        });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("handles a known body-parser error with a safe 4xx response", async () => {
        const bodyError = Object.assign(
            new Error("unsupported charset detail"),
            {
                type: "charset.unsupported",
                status: 415,
            }
        );
        const response = await request(createBoundaryApp(bodyError)).get(
            "/error"
        );

        expect(response.status).toBe(415);
        expect(response.body).toEqual({
            data: "No se pudo procesar el cuerpo de la solicitud",
        });
        expect(response.text).not.toContain(bodyError.message);
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    test("does not trust status on an otherwise unknown error", async () => {
        const unknownError = Object.assign(new Error("internal detail"), {
            status: 400,
        });
        const response = await request(createBoundaryApp(unknownError)).get(
            "/error"
        );

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: true,
            data: "Error interno del servidor",
        });
        expect(response.text).not.toContain(unknownError.message);
        expect(captureException).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledWith(unknownError);
        expect(logger.error).toHaveBeenCalledTimes(1);
    });

    test("returns an AppError without reporting it", async () => {
        const expectedError = new AppError(
            409,
            "EXPECTED_CONFLICT",
            "Conflicto esperado"
        );
        const response = await request(createBoundaryApp(expectedError)).get(
            "/error"
        );

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            data: "Conflicto esperado",
        });
        expect(captureException).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });
});

describe("observabilityLogger", () => {
    beforeEach(() => {
        sentryLogInfo.mockClear();
        sentryLogWarn.mockClear();
    });

    test("delegates info with common and additional metadata", () => {
        observabilityLogger.info("selected_application_event", {
            userId: 7,
            operation: "test_operation",
            status: "completed",
        });

        expect(sentryLogInfo).toHaveBeenCalledTimes(1);
        expect(sentryLogInfo).toHaveBeenCalledWith(
            "selected_application_event",
            {
                service: "journally-api",
                environment:
                    process.env.VERCEL_ENV ??
                    process.env.NODE_ENV ??
                    "development",
                userId: 7,
                operation: "test_operation",
                status: "completed",
            }
        );
        expect(sentryLogWarn).not.toHaveBeenCalled();
    });

    test("delegates warn with common and additional metadata", () => {
        observabilityLogger.warn("selected_warning_event", {
            entityId: 11,
            status: "rejected",
        });

        expect(sentryLogWarn).toHaveBeenCalledTimes(1);
        expect(sentryLogWarn).toHaveBeenCalledWith("selected_warning_event", {
            service: "journally-api",
            environment:
                process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
            entityId: 11,
            status: "rejected",
        });
        expect(sentryLogInfo).not.toHaveBeenCalled();
    });
});
