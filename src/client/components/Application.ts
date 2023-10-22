/// <reference lib="dom" />

import { h } from "vue";
import {
    ChatMessageService,
    ClientActivity,
    ServerConnection,
    UserLookupService,
    UserPosition,
    UserPresenceService,
} from "../services.ts";
import ChatWindow from "./ChatWindow.ts";
import UserIndicator from "./UserIndicator.ts";
import { Container } from "inversify";

export const c = new Container();

const conn = ServerConnection.fromAddress(window.location.href);

c.bind(ServerConnection).toConstantValue(conn);
c.bind(ChatMessageService).to(ChatMessageService).inSingletonScope();
c.bind(UserPresenceService).to(UserPresenceService).inSingletonScope();
c.bind(UserLookupService).to(UserLookupService).inSingletonScope();
c.bind(ClientActivity).to(ClientActivity).inSingletonScope();

export default {
    setup() {
        const users = c.get(UserPresenceService).users;

        const client = c.get(ClientActivity);

        let pending: Timer;
        window.addEventListener("mousemove", (ev) => {
            clearTimeout(pending);
            pending = setTimeout(() => {
                let lastMove = [ev.clientX, ev.clientY] satisfies UserPosition;
                client.sendMove(lastMove);
            }, 50);
        });

        return () =>
            h("div", null, [
                h(ChatWindow, null),
                ...users.value.map((u) => h(UserIndicator, { user: u })),
            ]);
    },
};
