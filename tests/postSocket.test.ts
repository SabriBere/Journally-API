import { EventEmitter } from "events";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import type { WebSocket, WebSocketServer } from "ws";

const autoSavePost = jest.fn<() => Promise<unknown>>();
const observabilityWarn = jest.fn();

jest.mock("../src/services/postServices", () => ({
    __esModule: true,
    default: { autoSavePost },
}));

jest.mock("../src/loggers/observabilityLogger", () => ({
    __esModule: true,
    default: { info: jest.fn(), warn: observabilityWarn },
}));

import { setupEntrySocket } from "../src/sockets/postSocket";

type TestSocket = EventEmitter & {
    send: jest.Mock;
    close: jest.Mock;
};

const validMessage = Buffer.from(
    JSON.stringify({ type: "entry:autosave", postId: 12, title: "Title" })
);

function connect() {
    const server = new EventEmitter();
    const socket = Object.assign(new EventEmitter(), {
        send: jest.fn(),
        close: jest.fn(),
    }) as TestSocket;
    const token = jwt.sign({ userId: 7 }, process.env.JWT_SECRET as string, {
        algorithm: "HS256",
        expiresIn: "1h",
    });
    const request = {
        headers: {
            origin: "http://localhost:3000",
            "sec-websocket-protocol": `access-token, ${token}`,
        },
    } as IncomingMessage;

    setupEntrySocket(server as WebSocketServer);
    server.emit("connection", socket as unknown as WebSocket, request);

    return { socket, token };
}

describe("WebSocket autosave observability", () => {
    beforeEach(() => {
        autoSavePost.mockReset();
        autoSavePost.mockResolvedValue({
            status: 200,
            error: false,
            data: { post_id: 12 },
        });
        observabilityWarn.mockClear();
    });

    test("does not log normal autosave traffic", () => {
        const { socket } = connect();

        socket.emit("message", validMessage);

        expect(observabilityWarn).not.toHaveBeenCalled();
        expect(socket.close).not.toHaveBeenCalled();
    });

    test("logs and closes exactly once when the message limit is exceeded", () => {
        const { socket, token } = connect();

        for (let attempt = 0; attempt < 22; attempt += 1) {
            socket.emit("message", validMessage);
        }

        expect(observabilityWarn).toHaveBeenCalledTimes(1);
        expect(observabilityWarn).toHaveBeenCalledWith(
            "websocket_message_rate_limited",
            {
                userId: 7,
                operation: "autosave",
                status: "rejected",
                reasonCode: "MESSAGE_RATE_LIMIT_EXCEEDED",
                count: 21,
                transport: "websocket",
            }
        );
        expect(JSON.stringify(observabilityWarn.mock.calls)).not.toContain(
            token
        );
        expect(socket.close).toHaveBeenCalledWith(
            1008,
            "Límite de mensajes excedido"
        );
    });

    test("does not log an autosave service failure", async () => {
        const databaseError = new Error("private database failure");
        autoSavePost.mockRejectedValue(databaseError);
        const { socket } = connect();

        socket.emit("message", validMessage);
        await new Promise(setImmediate);

        expect(observabilityWarn).not.toHaveBeenCalled();
        expect(socket.send).toHaveBeenLastCalledWith(
            JSON.stringify({
                type: "entry:error",
                error: true,
                data: databaseError.message,
            })
        );
    });
});
