/// <reference lib="dom" />

import { ChatMessage, MoveMessage } from "../proto";
import { SocketConnection } from "./connection.ts";
import { HostMessage, RoomMessage } from "../proto";

const messages: HTMLDivElement = document.querySelector("#messages")!;
const send: HTMLButtonElement = document.querySelector("#send")!;
const sendInput: HTMLInputElement = document.querySelector("#input")!;

const indicators: Record<number, HTMLDivElement> = {};

function onMessage(connection: SocketConnection, data: ArrayBuffer) {
    const hostMessage = HostMessage.decode(new Uint8Array(data));
    const { source, message } = hostMessage;

    if (message.chat) {
        const { chat } = message;
        const el = document.createElement("p");
        el.innerText = chat.body;
        el.style.setProperty("--i", source.toString());

        messages.appendChild(el);
    } else if (message.join) {
        const { id } = message.join;
        const el = document.createElement("div");
        el.classList.add("ind");
        el.style.setProperty("--i", id.toString());

        indicators[id] = el;
        document.body.appendChild(el);
    } else if (message.exit) {
        console.log("exited")
        const { id } = message.exit;
        const ind = indicators[id];

        document.body.removeChild(ind);
    } else if (message.move) {
        const { move } = message;
        const ind = indicators[source];
        ind.style.setProperty("--x", `${move.x}px`);
        ind.style.setProperty("--y", `${move.y}px`);
    }
}

const connection = new SocketConnection(onMessage);
send.addEventListener("click", () => {
    const chat = new RoomMessage({
        chat: new ChatMessage({ body: sendInput.value }),
    });
    connection.sendMessage(chat);
    messages.innerHTML += `<p>${chat.chat!.body}</p>`;

    sendInput.value = "";
});

document.addEventListener("mousemove", (ev) => {
    const move = new RoomMessage({
        move: new MoveMessage({ x: ev.offsetX, y: ev.offsetY }),
    });
    connection.sendMessage(move);
});
