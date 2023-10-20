import { h } from "vue";

import ChatMessage from "./ChatMessage.ts";
import ChatInput from "./ChatInput.ts";

import { ChatMessageService } from "../services.ts";

export default {
    setup() {
        const chatMessageService = ChatMessageService.resolve();
        const roomChats = chatMessageService.roomChats;

        return () =>
            h("div", { id: "chat-window" }, [
                ...roomChats.value.map((c) =>
                    h(ChatMessage, {
                        message: c,
                    }),
                ),
                h(ChatInput),
            ]);
    },
};
