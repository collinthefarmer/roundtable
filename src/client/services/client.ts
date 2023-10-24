import { inject, injectable } from "inversify";
import { ConnectionService } from "./connection.ts";
import { RoomMessage } from "../../proto";

export type ClientPosition = [number, number];
export type ClientReply = { body: string; reId: number };

export type ClientEvent = ChatEvent | MoveEvent | ChatReplyEvent;

export class ChatEvent extends CustomEvent<string> {
    constructor(body: string) {
        super("client:chat", { detail: body });
    }
}

export class ChatReplyEvent extends CustomEvent<ClientReply> {
    constructor(body: string, reId: number) {
        super("client:chat:reply", { detail: { body, reId } });
    }
}

export class MoveEvent extends CustomEvent<ClientPosition> {
    constructor(x: number, y: number) {
        super("client:move", { detail: [x, y] });
    }
}

export interface ClientService {
    dispatchEvent(ev: ClientEvent): boolean;
}

@injectable()
export class ClientService extends EventTarget {
    constructor(@inject(ConnectionService) connection: ConnectionService) {
        super();

        this.addEventListener("client:chat", (ev: Event) => {
            const chat = RoomMessage.Chat(0, 0, {
                body: (ev as ChatEvent).detail,
            });
            connection.send(chat);
            connection.dispatchEvent(
                new CustomEvent("message:chat", {
                    detail: RoomMessage.decode(chat),
                }),
            );
        });

        this.addEventListener("client:chat:reply", (ev: Event) => {
            const chat = RoomMessage.Chat(0, 0, (ev as ChatReplyEvent).detail);
            connection.send(chat);
            connection.dispatchEvent(
                new CustomEvent("message:chat", {
                    detail: RoomMessage.decode(chat),
                }),
            );
        });

        this.addEventListener("client:move", (ev: Event) => {
            const chat = RoomMessage.Move(0, 0, {
                x: (ev as MoveEvent).detail[0],
                y: (ev as MoveEvent).detail[1],
            });
            connection.send(chat);
        });
    }
}
