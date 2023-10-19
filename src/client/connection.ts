/// <reference lib="dom" />

export class SocketConnection {
    private ws: WebSocket;

    sendMessage(data: Uint8Array) {
        this.ws.send(data);
    }

    constructor(
        messageHandler: (
            connection: SocketConnection,
            data: ArrayBuffer,
        ) => Promise<void> | void,
    ) {
        this.ws = new WebSocket(this.wsLocation());
        this.ws.addEventListener("message", async (ev: MessageEvent<Blob>) => {
            const data = await ev.data.arrayBuffer();
            messageHandler(this, data);
        });
    }

    private wsLocation() {
        return window.location.href
            .replace("http://", "ws://")
            .replace("https://", "ws://");
    }
}
