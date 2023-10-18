import { Container, injectable } from "inversify";
import { ServerWebSocket, WebSocketHandler } from "bun";

export type SessionHandler = WebSocketHandler<Session>;
export type SessionConnection = ServerWebSocket<Session>;

export class Session {
    constructor(
        private roomId: string,
        private userId: string,
    ) {}
}

export class ChatRoomStore {
    private container: Container;
    
    getRoom(id: string): Room {
        this.container.get(id)
    }
    
    constructor() {
        this.container = new Container();
    }
}



@injectable()
export class ConnectedSession {}
