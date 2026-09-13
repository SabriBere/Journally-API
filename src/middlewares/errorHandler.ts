import { ErrorRequestHandler } from "express";
import AppError from "../errors/AppError";
import { mapKnownMiddlewareError } from "../errors/middlewareErrors";
import logger from "../loggers/logger";

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    const expectedError =
        error instanceof AppError ? error : mapKnownMiddlewareError(error);

    if (expectedError) {
        res.status(expectedError.status).json({ data: expectedError.message });
        return;
    }

    logger.error("Unexpected request error", {
        error,
        method: req.method,
        path: req.originalUrl,
        status: 500,
    });

    res.status(500).json({
        error: true,
        data: "Error interno del servidor",
    });
};

export default errorHandler;
