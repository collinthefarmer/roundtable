/// <reference lib="dom" />


import { h, ref } from "vue";
import { ClientActivity } from "../services.ts";
import { c } from "./Application.ts";

export default {
    setup() {
        const activity = c.get(ClientActivity);
        const body = ref("");
        return () =>
            h("form", {}, [
                h("input", {
                    type: "text",
                    onInput: (ev: InputEvent) => {
                        body.value = (ev.target as HTMLInputElement).value;
                    },
                }),
                h("input", {
                    type: "button",
                    onClick: () => {
                        activity.sendChat(body.value);
                    },
                }),
            ]);
    },
};
