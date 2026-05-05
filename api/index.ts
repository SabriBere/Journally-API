import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cookieParser from "cookie-parser";
import morgan from "morgan"; //combinar con winston o pino para logs de servidor
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/routes";
import prisma from "./db/db";
import notFound from "./middlewares/notFound";
import Swagger from "swagger-jsdoc";
import SwaggerUi from "swagger-ui-express";
import swaggerConfig from "./swagger/swagger";
import { setupEntrySocket } from "./sockets/postSocket";

const PORT = Number(process.env.PORT ?? 8080);
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) =>
    origin.trim()
);
const server = express();
const httpServer = createServer(server);
server.use(helmet());
server.use(express.json());
server.use(
    cors({
        origin: allowedOrigins?.length ? allowedOrigins : "http://localhost:3000",
        credentials: true,
    })
);
server.use(morgan("dev")); //configuración básica para desarrollo
server.use(cookieParser());

//configuración de swagger - documentación de end points
const docs = Swagger(swaggerConfig);
server.use(
    "/swagger",
    SwaggerUi.serve,
    SwaggerUi.setup(docs, {
        swaggerOptions: {
            persistAuthorization: true,
            responseInterceptor: (response: {
                headers?: Record<string, string> & {
                    get?: (header: string) => string | null;
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
                    swaggerUi?.preauthorizeApiKey("accessToken", accessToken);
                }

                if (refreshToken) {
                    swaggerUi?.preauthorizeApiKey("refreshToken", refreshToken);
                }

                return response;
            },
        },
    })
);

server.use("/api", routes);

// middleware de notFound
server.use(notFound);

async function startServer() {
    try {
        await prisma.$connect();
        console.log("✅ Conectado a la base de datos con Prisma");
    } catch (error) {
        await prisma.$disconnect();
        console.error("❌ Error conectando a la base de datos:", error);
    }

    httpServer.listen(PORT, () => {
        console.log("Enviroment", process.env.NODE_ENV);
        console.log("Server listen", PORT);
        console.log("API version", process.env.npm_package_version);
    });

    const wss = new WebSocketServer({
        path: "/entries",
        server: httpServer,
    });

    wss.on("listening", () => {
        console.log(`Socket listening on:${PORT}/entries`);
    });

    setupEntrySocket(wss);
}

startServer();
