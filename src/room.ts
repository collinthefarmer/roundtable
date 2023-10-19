import { inject, injectable } from "inversify";

import { StorageService } from "./storage.ts";
import { User } from "./user.ts";
import { HostMessage } from "./proto";

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
    public id: string;

    public users: User[] = [];

    public topic: string;

    public usrId: number = 0;
    public msgId: number = 0;

    constructor(roomId: string) {
        this.id = roomId;
        this.topic = `rooms/${this.id}`;
    }

    joinUser(user: User) {
        user.push(
            HostMessage.Join(this.nextMessageId(), 0, {
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
        return this.usrId++;
    }

    nextMessageId(): number {
        return this.msgId++;
    }
}
