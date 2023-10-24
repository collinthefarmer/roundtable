import { inject, injectable } from "inversify";
import {
    type MessageOfType,
    type MessageTypeKey,
    RoomMessage,
} from "../../proto";

export type CustomEventHandler<T> =
    | { (ev: CustomEvent<T>): void }
    | { handleEvent: (object: CustomEvent<T>) => void }
    | null;

export type ConnectionEventString =
    | (typeof ConnectionService)["AFTER_OPEN"]
    | (typeof ConnectionService)["AFTER_CLOSE"]
    | (typeof ConnectionService)["ON_ERROR"]
    | MessageTypeKey;

// interface necessary for message type safety
export interface ConnectionService {
    addEventListener<T extends ConnectionEventString>(
        type: `message:${T}`,
        callback: CustomEventHandler<
            T extends MessageTypeKey ? MessageOfType<T> : CustomEvent
        >,
        options?: AddEventListenerOptions | boolean,
    ): void;
}

@injectable()
export class ConnectionService extends EventTarget {
    static ADDRESS = Symbol();

    static AFTER_OPEN = "afterOpen" as const;
    static AFTER_CLOSE = "afterClose" as const;
    static ON_ERROR = "error" as const;

    private abort = new AbortController();
    private ws: WebSocket;

    send(data: Uint8Array) {
        this.ws.send(data);
    }

    constructor(@inject(ConnectionService.ADDRESS) address: string) {
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
        this.dispatchEvent(new CustomEvent(ConnectionService.AFTER_OPEN));
    }

    private onClose(event: Event<EventTarget>) {
        // close logic goes here
        this.dispatchEvent(new CustomEvent(ConnectionService.AFTER_CLOSE));
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
        // error logic goes here
        this.dispatchEvent(new CustomEvent(ConnectionService.ON_ERROR));
    }
}
