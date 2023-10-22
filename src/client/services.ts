/// <reference lib="dom" />
import { ref, type Ref } from "vue";
import { inject, injectable } from "inversify";
import { type MessageOfType, type MessageTypeKey, RoomMessage } from "../proto";
import { ChatMessage, MessageMeta } from "../proto/messages.ts";

export type ConnectionEventString =
    | (typeof ServerConnection)["AFTER_OPEN"]
    | (typeof ServerConnection)["AFTER_CLOSE"]
    | (typeof ServerConnection)["ON_ERROR"]
    | MessageTypeKey;

type ConnectionEventType<S extends ConnectionEventString> =
    S extends MessageTypeKey
        ? CustomEvent<MessageOfType<S>>
        : Event<EventTarget>;

export type ConnectionEventHandler<S extends ConnectionEventString> =
    | { (ev: ConnectionEventType<S>): void }
    | { handleEvent: (object: ConnectionEventType<S>) => void }
    | null;

// interface necessary for message type safety
export interface ServerConnection {
    addEventListener<T extends ConnectionEventString>(
        type: `message:${T}`,
        callback: ConnectionEventHandler<T>,
        options?: AddEventListenerOptions | boolean,
    ): void;
}

@injectable()
export class ServerConnection extends EventTarget {
    static AFTER_OPEN = "afterOpen" as const;
    static AFTER_CLOSE = "afterClose" as const;
    static ON_ERROR = "error" as const;

    private abort = new AbortController();

    static fromAddress(address: string) {
        return new ServerConnection(
            new WebSocket(address.replace(/^http/, "ws")),
        );
    }

    send(data: Uint8Array) {
        this.ws.send(data);
    }

    constructor(private ws: WebSocket) {
        super();

        const opts = { signal: this.abort.signal };
        this.ws.addEventListener("open", this.onOpen.bind(this), opts);
        this.ws.addEventListener("close", this.onClose.bind(this), opts);
        this.ws.addEventListener("message", this.onMessage.bind(this), opts);
        this.ws.addEventListener("error", this.onError.bind(this), opts);
    }

    private onOpen(event: Event<EventTarget>) {
        // open logic goes here
        this.dispatchEvent(new CustomEvent(ServerConnection.AFTER_OPEN));
    }

    private onClose(event: Event<EventTarget>) {
        // close logic goes here
        this.dispatchEvent(new CustomEvent(ServerConnection.AFTER_CLOSE));
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
        this.dispatchEvent(new CustomEvent(ServerConnection.ON_ERROR));
    }
}

export type Chat = MessageOfType<"chat">;

@injectable()
export class ChatMessageService {
    private chats: Chat[] = [];

    roomChats = ref<Chat[]>([]);
    replies: Ref<Chat[]>[] = [];

    constructor(@inject(ServerConnection) conn: ServerConnection) {
        conn.addEventListener("message:chat", (ev) => this.onChat(ev.detail));
    }

    addOwnChat(body: string, reId?: number) {
        const msg = new RoomMessage({
            source: 0,
            meta: new MessageMeta({
                id: this.chats.length,
                timestamp: Date.now(),
            }),
            type: "chat",
            chat: new ChatMessage({
                body,
                reId,
            }),
        });

        this.onChat(msg as Chat);
    }

    onChat(msg: Chat) {
        const existing = this.chats[msg.meta.id];
        if (existing && existing.source < 0) {
            this.moveOwn(msg.meta.id, existing, msg);
        }

        this.chats[msg.meta.id] = msg;
        this.replies[msg.meta.id] = ref([]);

        // console.log(`message ${msg.meta.id} received`)

        if (msg.chat.reId) {
            // console.log(`it's a reply to ${msg.chat.reId}`)

            const target = this.replies[msg.chat.reId];
            if (!target) {
                console.log("replied to missing message!");
            }

            target.value.push(msg);
        } else {
            this.roomChats.value[msg.meta.id] = msg;
        }
    }

    repliesRef(msg: Chat) {
        return this.replies[msg.meta.id];
    }

    private moveOwn(from: number, own: Chat, after: Chat): void {
        const idx = after.meta.id + 1;
        const next = this.chats[idx];
        if (next) {
            this.moveOwn(from, own, next);
        }

        this.chats[idx] = this.chats[from];
        this.replies[idx] = this.replies[from];

        if (this.roomChats.value.includes(own)) {
            this.roomChats.value[idx] = this.roomChats.value[from];
        }
    }
}

export type Join = MessageOfType<"join">;
export type Exit = MessageOfType<"exit">;
export type Move = MessageOfType<"move">;

export type UserPosition = [number, number];

@injectable()
export class UserPresenceService {
    users: Ref<number[]> = ref([]);
    positions: Array<Ref<UserPosition>> = [];

    constructor(@inject(ServerConnection) conn: ServerConnection) {
        conn.addEventListener("message:join", (ev) => this.onJoin(ev.detail));
        conn.addEventListener("message:exit", (ev) => this.onExit(ev.detail));
        conn.addEventListener("message:move", (ev) => this.onMove(ev.detail));
    }

    onJoin(msg: Join) {
        this.users.value.push(msg.join.user);
        this.positions[msg.join.user] = ref([0, 0]);
    }

    onExit(msg: Exit) {
        this.users.value = this.users.value.filter((f) => f !== msg.exit.user);
    }

    onMove(msg: Move) {
        this.positions[msg.source].value = [msg.move.x, msg.move.y];
    }
}

@injectable()
export class UserLookupService {
    private users: Record<number, Ref<{ name: string }>> = {
        0: ref({ name: "SELF" }),
        1: ref({ name: "ROOM" }),
    };

    ref(user: number): Ref<{ name: string }> {
        if (user in this.users) return this.users[user];
        const sourceValue = { name: "unresolved" };
        const sourceRef = ref(sourceValue);
        this.users[user] = sourceRef;

        return sourceRef;
    }

    registerJoined(join: MessageOfType<"join">): void {
        const { user } = join.join;
        const ref = this.users[user] ?? this.ref(user);

        const userData = { name: "jimmy" }; // resolve this from somewhere
        ref.value = userData;
    }
}

@injectable()
export class ClientActivity {
    constructor(
        @inject(ServerConnection) private conn: ServerConnection,
        @inject(ChatMessageService) private chats: ChatMessageService,
    ) {}

    sendChat(body: string) {
        const msg = RoomMessage.Chat(0, 0, { body });

        this.chats.addOwnChat(body);
        this.conn.send(msg);
    }

    sendMove(posi: UserPosition) {
        const [x, y] = posi;
        this.conn.send(
            RoomMessage.Move(0, 0, {
                x,
                y,
            }),
        );
    }
}
