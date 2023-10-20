import { h } from "vue";

export default {
    setup() {
        return () =>
            h("input", {
                type: "text",
            });
    },
};
