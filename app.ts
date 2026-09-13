import "./src/loggers/sentry";
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import apiApp from "./src/app";
import { setupEntrySocket } from "./src/sockets/postSocket";

const app = express();

app.use(apiApp);

const server = createServer(app);
const wss = new WebSocketServer({
    server,
    path: "/entries",
    maxPayload: 64 * 1024,
    handleProtocols: (protocols) =>
        protocols.has("access-token") ? "access-token" : false,
});

setupEntrySocket(wss);

export default server;
