/// <reference lib="dom" />

import { MessageOfType, MessageTypeKey, RoomMessage } from "../proto";

export type ConnectionEventString =
    | (typeof Connection)["AFTER_OPEN"]
    | (typeof Connection)["AFTER_CLOSE"]
    | (typeof Connection)["ON_ERROR"]
    | MessageTypeKey;

type ConnectionEventType<S extends ConnectionEventString> =
    S extends MessageTypeKey
        ? CustomEvent<MessageOfType<S>>
        : Event<EventTarget>;

export type ConnectionEventHandler<S extends ConnectionEventString> =
    | { (ev: ConnectionEventType<S>): void }
    | { handleEvent: (object: ConnectionEventType<S>) => void }
    | null;

export interface Connection {
    addEventListener<T extends ConnectionEventString>(
        type: `message:${T}`,
        callback: ConnectionEventHandler<T>,
        options?: AddEventListenerOptions | boolean,
    ): void;
}

export class Connection extends EventTarget {
    static AFTER_OPEN = "afterOpen" as const;
    static AFTER_CLOSE = "afterClose" as const;
    static ON_ERROR = "error" as const;

    private abort = new AbortController();

    private ws: WebSocket;

    static atCurrentLocation() {
        const url = window.location.href
            .replace("http://", "ws://")
            .replace("https://", "wss://");

        return new Connection(url);
    }

    constructor(address: string) {
        super();

        this.ws = new WebSocket(address);

        const opts = { signal: this.abort.signal };

        this.ws.addEventListener("open", this.onOpen.bind(this), opts);
        this.ws.addEventListener("close", this.onClose.bind(this), opts);
        this.ws.addEventListener("message", this.onMessage.bind(this), opts);
        this.ws.addEventListener("error", this.onError.bind(this), opts);
    }

    private onOpen(event: Event<EventTarget>) {
        // open logic goes here
        this.dispatchEvent(new CustomEvent(Connection.AFTER_OPEN));
    }

    private onClose(event: Event<EventTarget>) {
        // close logic goes here
        this.dispatchEvent(new CustomEvent(Connection.AFTER_CLOSE));
    }

    private async onMessage(msg: MessageEvent<Blob>) {
        const data = await msg.data.arrayBuffer();
        const message = RoomMessage.decode(new Uint8Array(data));

        const { type } = message;
        const event = new CustomEvent(`message:${type}`, {
            detail: message,
        });

        this.dispatchEvent(event);
    }

    private onError(event: Event) {
        this.dispatchEvent(new CustomEvent(Connection.ON_ERROR));
    }
}
