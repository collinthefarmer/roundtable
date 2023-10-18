import { Server, ServerWebSocket, WebSocketHandler } from "bun";

import { ChatMessage } from "./proto";

const clientScript = (
    await Bun.build({
        entrypoints: ["./src/client/index.ts"],
        minify: true,
        target: "browser",
    })
).outputs[0];

export const fetch = async (request: Request, server: Server) => {
    if (request.url.endsWith("client.js")) {
        return new Response(clientScript);
    }

    const roomMatch = new URL(request.url).pathname.match(/^\/\d+$/)?.[0];
    if (!roomMatch) return new Response(null, { status: 404 });

    const roomId = roomMatch.replace("/", "");
    server.upgrade(request, { data: { roomId } });

    return new Response(Bun.file("templates/index.html"));
};

type ConnectionProperties = {
    roomId: string;
};

interface Room {
    id: string;
    messages: ChatMessage[];
}

const rooms: { [key: string]: Room } = {};

export const websocket: WebSocketHandler<ConnectionProperties> = {
    open(ws: ServerWebSocket<ConnectionProperties>): void | Promise<void> {
        const room: Room = rooms[ws.data.roomId] ?? {
            id: ws.data.roomId,
            messages: [],
        };

        for (const msg of room.messages.slice(-2, room.messages.length)) {
            ws.send(ChatMessage.encode(msg).finish());
        }

        ws.subscribe(ws.data.roomId);
        rooms[ws.data.roomId] = room;
    },
    message(
        ws: ServerWebSocket<ConnectionProperties>,
        data: string | Buffer,
    ): void | Promise<void> {
        const room: undefined | Room = rooms[ws.data.roomId];

        if (!room) {
            ws.close();
            return;
        }

        const msg = ChatMessage.decode(new Uint8Array(Buffer.from(data)));
        room.messages.push(msg);

        ws.publish(ws.data.roomId, ChatMessage.encode(msg).finish());
    },
    close(
        ws: ServerWebSocket<ConnectionProperties>,
        code: number,
        reason: string,
    ): void | Promise<void> {},
    drain(ws: ServerWebSocket<ConnectionProperties>): void | Promise<void> {},
};
