import { h } from "vue";
import { c } from "./Application.ts";
import ChatMessage from "./ChatMessage.ts";
import ChatInput from "./ChatInput.ts";

import { ChatMessageService } from "../services.ts";

export default {
    setup() {
        const chatMessageService = c.get(ChatMessageService);
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
