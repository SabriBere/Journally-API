import { IncomingMessage } from "http";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { RawData, WebSocket, WebSocketServer } from "ws";
import PostServices from "../services/postServices";

const JWT_SECRET = process.env.JWT_SECRET as string;

type EntryAutosaveMessage = {
    type: "entry:autosave";
    postId: number;
    title?: string;
    description?: Prisma.InputJsonValue;
    clientRequestId?: string;
};

type EntrySocketMessage = EntryAutosaveMessage;

type SocketResponse = {
    type: "entry:connected" | "entry:saved" | "entry:error";
    data?: unknown;
    error?: boolean;
    clientRequestId?: string;
};

function sendJson(socket: WebSocket, response: SocketResponse) {
    socket.send(JSON.stringify(response));
}

function getTokenFromRequest(req: IncomingMessage) {
    const protocols = req.headers["sec-websocket-protocol"]
        ?.split(",")
        .map((value) => value.trim());
    return protocols?.[0] === "access-token" ? protocols[1] : undefined;
}

function getUserIdFromToken(token: string) {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded !== "object") {
        return null;
    }

    const userId = Number((decoded as JwtPayload).userId);
    return Number.isFinite(userId) ? userId : null;
}

function parseSocketMessage(message: RawData): EntrySocketMessage {
    const parsed = JSON.parse(message.toString());

    if (parsed?.type !== "entry:autosave") {
        throw new Error("Tipo de mensaje no soportado.");
    }

    if (!Number.isFinite(Number(parsed.postId))) {
        throw new Error("postId es obligatorio.");
    }

    if (parsed.title === undefined && parsed.description === undefined) {
        throw new Error("No se recibieron campos para guardar.");
    }

    if (
        parsed.title !== undefined &&
        (typeof parsed.title !== "string" || parsed.title.length > 200)
    ) {
        throw new Error(
            "El título debe ser texto y no superar 200 caracteres."
        );
    }

    return {
        type: "entry:autosave",
        postId: Number(parsed.postId),
        title: parsed.title,
        description: parsed.description,
        clientRequestId: parsed.clientRequestId,
    };
}

async function handleAutosave(
    socket: WebSocket,
    userId: number,
    message: EntryAutosaveMessage
) {
    const { status, error, data } = await PostServices.autoSavePost(
        userId,
        message.postId,
        {
            title: message.title,
            description: message.description,
        }
    );

    if (error) {
        sendJson(socket, {
            type: "entry:error",
            error: true,
            data,
            clientRequestId: message.clientRequestId,
        });
        return;
    }

    sendJson(socket, {
        type: "entry:saved",
        data: {
            status,
            post: data,
        },
        clientRequestId: message.clientRequestId,
    });
}

export function setupEntrySocket(wss: WebSocketServer) {
    wss.on("connection", (socket, req) => {
        const allowedOrigins = (
            process.env.ALLOWED_ORIGINS ?? "http://localhost:3000"
        )
            .split(",")
            .map((origin) => origin.trim());
        if (
            !req.headers.origin ||
            !allowedOrigins.includes(req.headers.origin)
        ) {
            socket.close(1008, "Origen no permitido");
            return;
        }

        const token = getTokenFromRequest(req);

        if (!token) {
            socket.close(1008, "Token no proporcionado");
            return;
        }

        let userId: number | null = null;

        try {
            userId = getUserIdFromToken(token);
        } catch {
            socket.close(1008, "Token inválido o expirado");
            return;
        }

        if (!userId) {
            socket.close(1008, "Token inválido");
            return;
        }

        sendJson(socket, {
            type: "entry:connected",
            data: "Socket de entradas conectado.",
        });

        let messageCount = 0;
        let windowStartedAt = Date.now();

        socket.on("message", async (rawMessage) => {
            try {
                const now = Date.now();
                if (now - windowStartedAt >= 1000) {
                    windowStartedAt = now;
                    messageCount = 0;
                }
                messageCount += 1;
                if (messageCount > 20) {
                    socket.close(1008, "Límite de mensajes excedido");
                    return;
                }
                const message = parseSocketMessage(rawMessage);
                await handleAutosave(socket, userId, message);
            } catch (error: any) {
                sendJson(socket, {
                    type: "entry:error",
                    error: true,
                    data: error.message,
                });
            }
        });
    });
}
