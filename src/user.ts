import { type ServerWebSocket } from "bun";
import { inject, injectable } from "inversify";

import { Room, RoomStore } from "./room.ts";

import { RoomMessage } from "./proto";

@injectable()
export class UserStore {}

@injectable()
export class User {
    static REQUEST = Symbol("DI token for request used to load a user.");
    static ROOM_ID = Symbol("DI token for room id a user wants to join.");

    public id: number;

    public room: Room;
    public conn: ServerWebSocket<User>;

    public topics: string[] = [];

    constructor(
        @inject(User.ROOM_ID) roomId: string,
        @inject(User.REQUEST) request: Request,
        @inject(UserStore) userStore: UserStore,
        @inject(RoomStore) roomStore: RoomStore,
    ) {
        this.room = roomStore.getOrCreateRoom(roomId);
        this.id = this.room.nextUserID();
    }

    join(ws: ServerWebSocket<User>) {
        if (this.conn) throw new Error("User has already been bound!");
        this.conn = ws;

        for (const topic of this.topics) {
            this.conn.subscribe(topic);
        }

        this.conn.subscribe(this.room.topic);
        this.room.joinUser(this);
    }

    exit(code: number, reason: string) {
        this.assertBind();
        this.room.exitUser(this);
    }

    push(data: Uint8Array) {
        this.assertBind();
        this.conn.publishBinary(
            this.room.topic,
            RoomMessage.decode(data).reSource(this.id),
        );
    }

    send(data: Uint8Array) {
        this.assertBind();
        this.conn.sendBinary(RoomMessage.decode(data).reSource(this.id));
    }

    sendChat(from: number, body: string) {
        this.assertBind();
        this.conn.sendBinary(
            RoomMessage.Chat(this.room.nextMessageId(), from, { body }),
        );
    }

    sendJoin(user: number) {
        this.assertBind();
        this.conn.sendBinary(
            RoomMessage.Join(this.room.nextMessageId(), 0, { user }),
        );
    }

    sendExit(user: number) {
        this.assertBind();
        this.conn.sendBinary(
            RoomMessage.Exit(this.room.nextMessageId(), 0, { user }),
        );
    }

    private assertBind() {
        if (!this.conn) throw new Error("User has not been bound!");
    }
}
