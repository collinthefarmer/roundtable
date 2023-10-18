import { inject, injectable, unmanaged } from "inversify";
import { Message } from "protobufjs/light";

import { ServerWebSocket, WebSocketHandler } from "bun";

import { ChatMessage } from "./proto";
import { container } from "./router.ts";

interface ParticipantData {
    roomId: string;
    userId: string;
}

export type ParticipantConnection = ServerWebSocket<ParticipantData>;
export type ParticipantConnectionHandler = WebSocketHandler<ParticipantData>;


@injectable()
export class Participant {
    static fromWS(ws: ParticipantConnection) {
        return new Participant(ws);
    }

    roomId: string;
    userId: string;

    sendMessage(body: string) {}

    joinRoom(room: Room) {
        for (const t in Object.values(room.topics)) {
            this.ws.subscribe(t);
        }
    }

    constructor(
        private ws: ParticipantConnection
    ) {
        this.userId = this.ws.data.userId;
        this.roomId = this.ws.data.roomId;
    }
}

@injectable()
export class RoomStore {
    private store: { [key: string]: Room } = {};

    get(id: string): Room | undefined {
        return this.store[id];
    }

    getOrCreate(id: string): Room {
        if (id in this.store) return this.store[id];

        const createdRoom = container.get(Room);
        createdRoom.id = id;
        this.add(createdRoom);

        return createdRoom;
    }

    private add(room: Room) {
        this.store[room.id] = room;
    }
}

@injectable()
export class Room {
    static RECENT_MESSAGES_OFFSET = 60 * 60 * 1000;

    public id: string;

    public messages: ChatMessage[] = [];

    get topics() {
        return {
            chat: this.messageTopic(ChatMessage),
        };
    }

    get recentMessages() {
        return this.messages.filter(
            (m) =>
                m.timestamp >=
                new Date().getTime() - Room.RECENT_MESSAGES_OFFSET,
        );
    }

    constructor(@inject(RoomStore) private roomStore: RoomStore) {}

    addMessage(msg: ChatMessage) {
        this.messages.push(msg);
    }

    private messageTopic(n: typeof Message) {
        return `${this.id}/${n.$type.name}`;
    }
}
