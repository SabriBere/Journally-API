import "./loggers/sentry";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import prisma from "./db/db";
import { setupEntrySocket } from "./sockets/postSocket";

const PORT = Number(process.env.PORT ?? 8080);
const API_VERSION = process.env.npm_package_version ?? "unknown";
const httpServer = createServer(app);

async function startServer() {
    try {
        await prisma.$connect();
        console.log("✅ Conectado a la base de datos con Prisma");
    } catch (error) {
        await prisma.$disconnect();
        console.error("❌ Error conectando a la base de datos:", error);
        process.exitCode = 1;
        return;
    }

    httpServer.listen(PORT, () => {
        console.log("Environment", process.env.NODE_ENV);
        console.log("Server listening", PORT);
        console.log("API version", API_VERSION);
    });

    const wss = new WebSocketServer({
        path: "/entries",
        server: httpServer,
        maxPayload: 64 * 1024,
        handleProtocols: (protocols) =>
            protocols.has("access-token") ? "access-token" : false,
    });

    wss.on("listening", () => {
        console.log(`Socket listening on:${PORT}/entries`);
    });

    setupEntrySocket(wss);
}

startServer();
