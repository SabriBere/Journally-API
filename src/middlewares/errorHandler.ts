import { ErrorRequestHandler } from "express";
import AppError from "../errors/AppError";
import logger from "../loggers/logger";

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error instanceof AppError) {
        res.status(error.status).json({ data: error.message });
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
