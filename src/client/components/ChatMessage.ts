/// <reference lib="dom" />


import { h } from "vue";
import { Chat, ChatMessageService, UserLookupService } from "../services.ts";
import { c } from "./Application.ts";

export const ChatMessage = {
    props: {
        message: Object,
    },
    setup(props: { message: Chat }) {
        const {
            chat: { body },
            source,
        } = props.message;

        const users = c.get(UserLookupService);
        const fromUser = users.ref(source);

        const chats = c.get(ChatMessageService);
        const replies = chats.repliesRef(props.message);

        return () =>
            h("article", { style: `--source: ${source};`, class: "sourced" }, [
                h("h6", fromUser.value.name),
                h("p", body),
                h(
                    "ol",
                    replies.value.map((c) =>
                        h("li", h(ChatMessage, { message: c })),
                    ),
                ),
            ]);
    },
};

export default ChatMessage;
