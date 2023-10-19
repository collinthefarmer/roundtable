/// <reference lib="dom" />

import { SocketConnection } from "./connection.ts";
import { HostMessage } from "../proto";

const messages: HTMLDivElement = document.querySelector("#messages")!;
const send: HTMLButtonElement = document.querySelector("#send")!;
const sendInput: HTMLInputElement = document.querySelector("#input")!;

const indicators: Record<number, HTMLDivElement> = {};

function onMessage(connection: SocketConnection, data: ArrayBuffer) {
    const hostMessage = HostMessage.decode(new Uint8Array(data));
    const { source, type, chat, join, move, exit } = hostMessage;

    console.log(type);

    if (chat) {
        const el = document.createElement("p");
        el.innerText = chat.body;
        el.style.setProperty("--i", source.toString());

        messages.appendChild(el);
    } else if (join) {
        const id = join.user;

        const el = document.createElement("div");
        el.classList.add("ind");
        el.style.setProperty("--i", id.toString());

        indicators[id] = el;
        document.body.appendChild(el);
    } else if (exit) {

        const id = exit.user;
        const ind = indicators[id];

        document.body.removeChild(ind);
    } else if (move) {
        const { x, y } = move;
        const ind = indicators[source];

        ind.style.setProperty("--x", `${x}px`);
        ind.style.setProperty("--y", `${y}px`);
    }
}

const connection = new SocketConnection(onMessage);
send.addEventListener("click", () => {
    const chat = HostMessage.Chat(1, 0, {
        body: sendInput.value,
    });
    connection.sendMessage(chat);
    messages.innerHTML += `<p>${sendInput.value}</p>`;

    sendInput.value = "";
});

document.addEventListener("mousemove", (ev) => {
    const move = HostMessage.Move(1, 0, {
        x: ev.clientX,
        y: ev.clientY,
    });
    connection.sendMessage(move);
});
