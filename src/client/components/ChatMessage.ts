import { h } from "vue";
import { Chat, ChatMessageService, UserLookupManager } from "../services.ts";

export const ChatMessage = {
    props: {
        message: Object,
    },
    setup(props: { message: Chat }) {
        const {
            chat: { body },
            source,
        } = props.message;

        const users = UserLookupManager.resolve();
        const fromUser = users.ref(source);

        const chatMessageService = ChatMessageService.resolve();
        const replies = chatMessageService.repliesRef(props.message);

        return () =>
            h("article", { style: `--source: ${source};` }, [
                h("h6", fromUser.value.name),
                h("p", body),
                h(
                    "ol",
                    replies.value.map((c) => {
                        h("li", h(ChatMessage, { message: c }));
                    }),
                ),
            ]);
    },
};

export default ChatMessage;
