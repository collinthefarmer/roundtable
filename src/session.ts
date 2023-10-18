import { ServerWebSocket, WebSocketHandler } from "bun";

import { Container, injectable } from "inversify";

import { HostMessage, RoomMessage, JoinMessage, ExitMessage } from "./proto";

@injectable()
export class RoomStore {
    private container: Container;

    getRoom(id: string): Room | null {
        if (this.container.isBound(id)) {
            return this.container.get(id);
        }

        return null;
    }

    createRoom(id: string): Room {
        const room = new Room(id);
        this.container.bind(id).toConstantValue(room);

        return room;
    }

    constructor() {
        this.container = new Container();
    }
}

export class Room {
    topic: string;

    sessions: Session[] = [];

    join(session: Session): number {
        const id = this.sessions.length + 1;

        session.send(
            new HostMessage({
                source: 0,
                message: new RoomMessage({
                    join: new JoinMessage({
                        id,
                    }),
                }),
            }),
        );

        for (const current of this.sessions) {
            session.receive(
                new HostMessage({
                    source: 0,
                    message: new RoomMessage({
                        join: new JoinMessage({
                            id: current.userId,
                        }),
                    }),
                }),
            );
        }

        this.sessions.push(session);
        return id;
    }

    exit(session: Session, code: number, reason: string) {
        this.sessions = this.sessions.filter((s) => s !== session);

        for (const current of this.sessions) {
            current.receive(
                new HostMessage({
                    source: 0,
                    message: new RoomMessage({
                        exit: new ExitMessage({
                            id: session.userId,
                        }),
                    }),
                }),
            );
        }
    }

    constructor(public id: string) {
        this.topic = this.id;
    }
}

export type SessionHandler = WebSocketHandler<Session>;
export type SessionConnection = ServerWebSocket<Session>;

export class Session {
    public room: Room;
    public conn: SessionConnection;

    public userId: number;

    constructor(
        private roomId: string,
        private roomStore: RoomStore,
    ) {
        this.room =
            this.roomStore.getRoom(this.roomId) ??
            this.roomStore.createRoom(this.roomId);
    }

    send(message: HostMessage) {
        if (!this.conn) throw new Error("Session has not been bound!");

        this.conn.publishBinary(
            this.room.topic,
            HostMessage.encode(message).finish(),
        );
    }

    receive(message: HostMessage) {
        if (!this.conn) throw new Error("Session has not been bound!");
        this.conn.sendBinary(HostMessage.encode(message).finish());
    }

    forward(message: RoomMessage, source: number) {
        if (!this.conn) throw new Error("Session has not been bound!");

        this.conn.publishBinary(
            this.room.topic,
            HostMessage.encode(
                new HostMessage({
                    source,
                    message,
                }),
            ).finish(),
        );
    }

    bind(ws: SessionConnection) {
        if (this.conn) throw new Error("Session has already been bound!");
        this.conn = ws;
        this.conn.subscribe(this.room.topic);

        this.userId = this.room.join(this);
    }

    drop(code: number, reason: string) {
        this.room.exit(this, code, reason);
    }
}
