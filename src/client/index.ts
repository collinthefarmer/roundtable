/// <reference lib="dom" />

import { ChatMessage } from "../proto";
import { SocketConnection } from "./connection.ts";

const messages: HTMLDivElement = document.querySelector("#messages")!;
const send: HTMLButtonElement = document.querySelector("#send")!;
const sendInput: HTMLInputElement = document.querySelector("#input")!;

function onMessage(connection: SocketConnection, data: ArrayBuffer) {
    const chat = ChatMessage.decode(new Uint8Array(data));
    messages.innerHTML += `<p>${chat.body}</p>`;
}

const connection = new SocketConnection(onMessage);
send.addEventListener("click", () => {
    const chat = new ChatMessage({ body: sendInput.value });
    connection.sendMessage(chat);
    messages.innerHTML += `<p>${chat.body}</p>`;

    sendInput.value = "";
});
