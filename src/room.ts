import { inject, injectable } from "inversify";

import { StorageService } from "./storage.ts";
import { User } from "./user.ts";
import { RoomMessage } from "./proto";
import { MessageMeta } from "./proto/messages.ts";

@injectable()
export class RoomStore {
    constructor(@inject(StorageService) private storage: StorageService) {}

    getOrCreateRoom(roomId: string): Room {
        let room = this.storage.get(roomId, Room);
        if (!room) {
            room = this.storage.create(roomId, new Room(roomId));
        }

        return room;
    }
}

export class Room {
    static ROOM_SOURCE_ID = 1;

    public id: string;

    public users: User[] = [];

    public topic: string;

    public usrId: number = 2;
    public msgId: number = 0;

    constructor(roomId: string) {
        this.id = roomId;
        this.topic = `rooms/${this.id}`;
    }

    stampMessage(message: RoomMessage, source: number): Uint8Array {
        return RoomMessage.encode(
            new RoomMessage({
                meta: new MessageMeta({
                    id: this.nextMessageId(),
                    timestamp: message.meta.timestamp,
                }),
                source,
                type: message.type,
                [message.type]: message[message.type],
            }),
        ).finish();
    }

    joinUser(user: User) {
        user.push(
            RoomMessage.Join(this.nextMessageId(), Room.ROOM_SOURCE_ID, {
                user: user.id,
            }),
        );

        // send joins for any currently connected users to joining user
        for (const curr of this.users) {
            user.sendJoin(curr.id);
        }

        this.users.push(user);
    }

    exitUser(user: User) {
        this.users = this.users.filter((u) => u !== user);

        if (this.users.length === 0) return;

        for (const curr of this.users) {
            curr.sendExit(user.id);
        }
    }

    nextUserID(): number {
        return ++this.usrId;
    }

    nextMessageId(): number {
        return ++this.msgId;
    }
}
