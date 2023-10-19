import "reflect-metadata";

import { Container } from "inversify";

import { fetch } from "./router";
import { websocket } from "./sockets.ts";

import { User, UserStore } from "./user.ts";
import { MemoryStorageService, StorageService } from "./storage.ts";
import { RoomStore } from "./room.ts";

export const clientScript = (
    await Bun.build({
        entrypoints: ["./src/client/index.ts"],
        target: "browser",
    })
).outputs[0];

export const container = new Container();
container.bind(StorageService).to(MemoryStorageService).inSingletonScope();

container.bind(UserStore).to(UserStore);
container.bind(RoomStore).to(RoomStore);
container.bind(User).to(User);

async function main() {
    Bun.serve({ fetch, websocket });
}

await main();
