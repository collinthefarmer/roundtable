import { container } from "../../container.ts";
import { RoomService } from "../../services/room.ts";
import { ChatEvent, ClientService, MoveEvent } from "../../services/client.ts";

// general idea:
// users send messages which are physically located on page according to
// users' cursors x/y positions when message is sent
// client can move cursor around to discover sent messages which
// fade into view as cursor approaches the point from which they were sent

// maybe a timeline view to show positions of messages over time
// 3d rotation could be fun for display

export function main() {
    const users: [null | HTMLDivElement, number, number][] = [[null, 0, 0]]; // init with 0 for client

    const room = container.get(RoomService);
    const main = document.querySelector("main")!;

    room.addEventListener("message:user:join", (u) => {
        console.debug(`user joined: ${u.detail}`);

        const ind = document.createElement("div");
        ind.id = `user-${u.detail}`;
        ind.className = "ind";
        ind.style.setProperty("--x", `${0}px`);
        ind.style.setProperty("--y", `${0}px`);
        ind.style.setProperty("--src", u.detail.toString(10));

        users[u.detail] = [ind, 0, 0];
        main.appendChild(ind);
    });

    room.addEventListener("message:user:move", (u) => {
        console.debug(`user moved: ${u.detail.user}`);

        const [ind, lx, ly] = users[u.detail.user];
        const { user, x, y } = u.detail;
        if (!ind) return;

        users[user] = [ind, x, y];

        ind.style.setProperty("--x", `${x}px`);
        ind.style.setProperty("--y", `${y}px`);

        ind.style.setProperty("--lx", `${lx}px`);
        ind.style.setProperty("--ly", `${ly}px`);
    });

    room.addEventListener("message:chat", (ev) => {
        console.debug(`user chatted: ${ev.detail.user}`);

        const pos = users[ev.detail.user];
        const el = document.createElement("p");
        el.style.setProperty("--x", `${pos[1]}px`);
        el.style.setProperty("--y", `${pos[2]}px`);
        el.innerText = ev.detail.body;

        // checking if is own message
        if (ev.detail.user) {
            el.className = "msg";
        } else {
            el.className = "msg own";
        }

        document.querySelector("main")!.appendChild(el);
    });

    // continue from here: listen to client movement,
    // set higher up css vars to users position,
    // use distance between points to scale visibility of incoming messages?
    const client = container.get(ClientService);

    let modalOpened = false;

    const onMouseMove = (ev: MouseEvent) => {
        if (modalOpened) return;

        const [x, y] = [ev.clientX, ev.clientY];
        users[0] = [null, x, y];

        client.dispatchEvent(new MoveEvent(ev.clientX, ev.clientY));

        const main = document.querySelector("main")!;
        main.style.setProperty("--cx", `${x}px`);
        main.style.setProperty("--cy", `${y}px`);
    };

    window.addEventListener("mousemove", onMouseMove);

    const msgDialog = document.createElement("dialog");
    const msgForm = document.createElement("form");
    const msgInput = document.createElement("input");
    const msgSubmit = document.createElement("button");

    msgForm.method = "dialog";

    msgInput.type = "text";
    msgInput.autofocus = true;
    msgInput.placeholder = "...";

    msgSubmit.innerText = "Send";

    msgSubmit.addEventListener("click", (ev) => {
        msgDialog.close();
        modalOpened = false;
    });

    msgForm.append(msgInput, msgSubmit);
    msgDialog.append(msgForm);
    main.appendChild(msgDialog);

    msgDialog.addEventListener("close", (ev) => {
        client.dispatchEvent(new ChatEvent(msgInput.value));
        msgInput.value = "";
        window.addEventListener("mousemove", onMouseMove);
    });

    window.addEventListener("mouseup", (ev) => {
        if (ev.button != 0) return;
        msgDialog.showModal();
        modalOpened = true;
        window.removeEventListener("mousemove", onMouseMove);
    });

    // interaction (send chat) by clicking on screen to create chat modal for text input.
    // use this to lock user position until message is sent
}

export default main;
