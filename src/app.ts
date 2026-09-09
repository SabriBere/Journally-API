import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan"; //combinar con winston o pino para logs de servidor
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/routes";
import notFound from "./middlewares/notFound";
import Swagger from "swagger-jsdoc";
import SwaggerUi from "swagger-ui-express";
import swaggerConfig from "./swagger/swagger";
import { rateLimit } from "express-rate-limit";

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) =>
    origin.trim()
);

const app = express();

app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(
    cors({
        origin: allowedOrigins?.length
            ? allowedOrigins
            : "http://localhost:3000",
        credentials: true,
        exposedHeaders: ["x-access-token", "x-refresh-token"],
    })
);
app.use(morgan("dev"));
app.use(cookieParser());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        error: true,
        data: "Demasiados intentos. Intente nuevamente más tarde.",
    },
});

app.use("/api", apiLimiter);
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users/refresh", authLimiter);

if (process.env.NODE_ENV === "development") {
    // Configuración de Swagger para documentación local de endpoints.
    const docs = Swagger(swaggerConfig);
    app.use(
        "/swagger",
        SwaggerUi.serve,
        SwaggerUi.setup(docs, {
            swaggerOptions: {
                persistAuthorization: true,
                responseInterceptor: (response: {
                    headers?: Record<string, string> & {
                        get?: CallableFunction;
                    };
                }) => {
                    const headers = response.headers;
                    const accessToken =
                        headers?.["x-access-token"] ??
                        headers?.get?.("x-access-token");
                    const refreshToken =
                        headers?.["x-refresh-token"] ??
                        headers?.get?.("x-refresh-token");
                    const swaggerUi = (globalThis as any).ui;

                    if (accessToken) {
                        swaggerUi?.preauthorizeApiKey(
                            "accessToken",
                            accessToken
                        );
                    }

                    if (refreshToken) {
                        swaggerUi?.preauthorizeApiKey(
                            "refreshToken",
                            refreshToken
                        );
                    }

                    return response;
                },
            },
        })
    );
}

app.use("/api", routes);
app.use(notFound);

export default app;
