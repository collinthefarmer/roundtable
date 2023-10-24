import { inject, injectable } from "inversify";
import { ConnectionService, CustomEventHandler } from "./connection.ts";

export type Chat = { user: number; body: string };
export type ChatReply = Chat & { reId: number };
export type Join = { user: number };
export type Exit = Join;
export type Move = { x: number; y: number; user: number };

export type EventMap = {
    "message:chat:reply": Chat;
    "message:chat": ChatReply;
    "message:user:join": number;
    "message:user:exit": number;
    "message:user:move": Move;
};

export interface RoomService {
    addEventListener<T extends keyof EventMap>(
        event: T,
        callback: CustomEventHandler<EventMap[T]>,
        options?: AddEventListenerOptions | boolean,
    ): void;
}

@injectable()
export class RoomService extends EventTarget {
    constructor(@inject(ConnectionService) connection: ConnectionService) {
        super();

        connection.addEventListener("message:chat", (ev) => {
            const {
                chat: { body, reId },
                source,
            } = ev.detail;

            if (reId) {
                this.dispatchEvent(
                    new CustomEvent("message:chat:reply", {
                        detail: { reId, body, user: source },
                    }),
                );
            } else {
                this.dispatchEvent(
                    new CustomEvent("message:chat", {
                        detail: { body, user: source },
                    }),
                );
            }
        });

        connection.addEventListener("message:join", (ev) => {
            const {
                join: { user },
            } = ev.detail;

            this.dispatchEvent(
                new CustomEvent("message:user:join", { detail: user }),
            );
        });

        connection.addEventListener("message:exit", (ev) => {
            const {
                exit: { user },
            } = ev.detail;

            this.dispatchEvent(
                new CustomEvent("message:user:exit", { detail: user }),
            );
        });

        connection.addEventListener("message:move", (ev) => {
            const {
                move: { x, y },
                source,
            } = ev.detail;

            this.dispatchEvent(
                new CustomEvent("message:user:move", {
                    detail: { x, y, user: source },
                }),
            );
        });
    }
}
