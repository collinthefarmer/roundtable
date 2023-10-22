/// <reference lib="dom" />
import "reflect-metadata";

import { createApp } from "vue";

import Application from "./components/Application.ts";

function init() {
    const main = document.querySelector("main");
    if (!main) throw new Error("No main!");

    const vapp = createApp(Application);
    vapp.mount(main);
}

init();

// const messages: HTMLDivElement = document.querySelector("#messages")!;
// const send: HTMLButtonElement = document.querySelector("#send")!;
// const sendInput: HTMLInputElement = document.querySelector("#input")!;
//
// const indicators: Record<number, HTMLDivElement> = {};
//
// function onMessage(connection: SocketConnection, data: ArrayBuffer) {
//     const hostMessage = RoomMessage.decode(new Uint8Array(data));
//     const { source, chat, join, move, exit } = hostMessage;
//
//     if (chat) {
//         const el = document.createElement("p");
//         el.innerText = chat.body;
//         el.style.setProperty("--i", source.toString());
//
//         messages.appendChild(el);
//     } else if (join) {
//         const id = join.user;
//
//         const el = document.createElement("div");
//         el.classList.add("ind");
//         el.style.setProperty("--i", id.toString());
//
//         indicators[id] = el;
//         document.body.appendChild(el);
//     } else if (exit) {
//
//         const id = exit.user;
//         const ind = indicators[id];
//
//         document.body.removeChild(ind);
//     } else if (move) {
//         const { x, y } = move;
//         const ind = indicators[source];
//
//         ind.style.setProperty("--x", `${x}px`);
//         ind.style.setProperty("--y", `${y}px`);
//     }
// }
//
// const connection = new SocketConnection(onMessage);
// send.addEventListener("click", () => {
//     const chat = RoomMessage.Chat(1, 0, {
//         body: sendInput.value,
//     });
//     connection.sendMessage(chat);
//     messages.innerHTML += `<p>${sendInput.value}</p>`;
//
//     sendInput.value = "";
// });
//
// document.addEventListener("mousemove", (ev) => {
//     const move = RoomMessage.Move(1, 0, {
//         x: ev.clientX,
//         y: ev.clientY,
//     });
//     connection.sendMessage(move);
// });
