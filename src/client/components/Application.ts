import {
    ChatMessageService,
    ServerConnection,
    UserLookupManager,
} from "../services.ts";
import { h } from "vue";
import ChatWindow from "./ChatWindow.ts";

export default {
    setup() {
        const connection = ServerConnection.instantiate(window.location.href);

        const chatMessageService = ChatMessageService.instantiate();
        chatMessageService.listen(connection);

        const userLookupManager = UserLookupManager.instantiate();

        return () => h(ChatWindow);
    },
};
