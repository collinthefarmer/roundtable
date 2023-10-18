import { Server } from "bun";

import { Container } from "inversify";

import {
    Session,
    SessionConnection,
    SessionHandler,
    RoomStore,
} from "./session.ts";
import { RoomMessage } from "./proto";

export const container = new Container();
container.bind(RoomStore).to(RoomStore).inSingletonScope();

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
    const roomStore = container.get(RoomStore);
    server.upgrade(request, { data: new Session(roomId, roomStore) });

    return new Response(Bun.file("templates/index.html"));
};

export const websocket: SessionHandler = {
    open(ws: SessionConnection): void | Promise<void> {
        const session = ws.data;
        session.bind(ws);
    },
    message(
        ws: SessionConnection,
        data: string | Buffer,
    ): void | Promise<void> {
        const session = ws.data;
        const content = new Uint8Array(Buffer.from(data));
        session.forward(RoomMessage.decode(content), session.userId);
    },
    close(
        ws: SessionConnection,
        code: number,
        reason: string,
    ): void | Promise<void> {
        const session = ws.data;
        session.drop(code, reason);
    },
    // drain(ws: SessionConnection): void | Promise<void> {},
};
