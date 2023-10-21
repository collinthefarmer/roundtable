/// <reference lib="dom" />
import {inject, provide, ref, type Ref} from "vue";
import {type MessageOfType, type MessageTypeKey, RoomMessage} from "../proto";

// helper abstract class for DI methods and type safety
abstract class SingletonService extends EventTarget {
    static services = new Map<typeof SingletonService, symbol>();

    protected static getInjectionKey(t: typeof SingletonService) {
        return this.services.get(t);
    }

    protected static setInjectionKey(t: typeof SingletonService) {
        if (this.services.has(t)) {
            throw new Error(`SingletonService ${t.name} instantiated twice!`);
        }

        const sym = Symbol(t.name);
        this.services.set(t, sym);

        return sym;
    }

    static instantiate<T extends new (...args: any) => any>(
        this: T,
        ...args: ConstructorParameters<T>
    ): InstanceType<T> {
        const inst = new this(...(args as any));
        provide(SingletonService.setInjectionKey(this as any), inst);

        return inst;
    }

    static resolve<T extends new (...args: any) => any>(
        this: T,
    ): InstanceType<T> {
        const key = SingletonService.getInjectionKey(this as any);
        if (!key) {
            throw new Error(
                `Attempted to resolve ${this.name} before it has been provided!`,
            );
        }

        return inject(key) as InstanceType<T>;
    }
}

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

export class ServerConnection extends SingletonService {
    static AFTER_OPEN = "afterOpen" as const;
    static AFTER_CLOSE = "afterClose" as const;
    static ON_ERROR = "error" as const;

    private abort = new AbortController();

    private ws: WebSocket;

    constructor(address: string) {
        super();

        this.ws = new WebSocket(address.replace(/^http/, "ws"));

        const opts = {signal: this.abort.signal};
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

        const {type} = message;
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

export class ChatMessageService extends SingletonService {
    private chats: Chat[] = [];

    roomChats = ref<Chat[]>([]);
    replies: Ref<Chat[]>[] = [];

    listen(conn: ServerConnection) {
        conn.addEventListener("message:chat", (ev) => this.onChat(ev.detail));
    }

    onChat(msg: Chat) {
        this.chats[msg.meta.id] = msg;
        this.replies[msg.meta.id] = ref([]);

        // console.log(`message ${msg.meta.id} received`)

        if (msg.chat.reId) {
            // console.log(`it's a reply to ${msg.chat.reId}`)

            const target = this.replies[msg.chat.reId];
            if (!target) {
                console.log("replied to missing message!")
            }

            target.value.push(msg)
        } else {
            this.roomChats.value.push(msg);
        }
    }

    repliesRef(msg: Chat) {
        return this.replies[msg.meta.id];
    }
}

export class UserLookupManager extends SingletonService {
    private users: Record<number, Ref<{ name: string }>> = {
        0: ref({name: "ROOM"}),
    };

    ref(user: number): Ref<{ name: string }> {
        if (user in this.users) return this.users[user];
        const sourceValue = {name: "unresolved"};
        const sourceRef = ref(sourceValue);
        this.users[user] = sourceRef;

        return sourceRef;
    }

    registerJoined(join: MessageOfType<"join">): void {
        const {user} = join.join;
        const ref = this.users[user] ?? this.ref(user);

        const userData = {name: "jimmy"}; // resolve this from somewhere
        ref.value = userData;
    }
}
