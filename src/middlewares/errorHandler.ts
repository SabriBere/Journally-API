import { ErrorRequestHandler } from "express";
import logger from "../loggers/logger";

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    const status = Number(error?.status ?? error?.statusCode ?? 500);

    if (status >= 500) {
        logger.error("Unexpected request error", {
            error,
            method: req.method,
            path: req.originalUrl,
            status,
        });
    }

    res.status(status).json({
        error: true,
        data: status >= 500 ? "Error interno del servidor" : error.message,
    });
};

export default errorHandler;
