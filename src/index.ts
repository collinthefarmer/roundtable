import "reflect-metadata";

import { fetch, websocket } from "./router";

async function main() {
    Bun.serve({ fetch, websocket });
}

await main();
