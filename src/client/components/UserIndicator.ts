import { h, ref } from "vue";

import { UserPresenceService } from "../services.ts";
import { c } from "./Application.ts";

export default {
    props: {
        user: Number,
    },
    setup(props: { user: number }) {
        const userPresenceService = c.get(UserPresenceService);
        const position = userPresenceService.positions[props.user];

        return () =>
            h("div", {
                style: `--x: ${position.value[0]}px; --y: ${position.value[1]}px; --source: ${props.user}`,
                class: "ind sourced",
            });
    },
};
