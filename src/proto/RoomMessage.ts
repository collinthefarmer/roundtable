import { Field, Message, OneOf } from "protobufjs/light";

import { ChatMessage } from "./ChatMessage.ts";
import { MoveMessage } from "./MoveMessage.ts";
import { JoinMessage } from "./JoinMessage.ts";
import { ExitMessage } from "./ExitMessage.ts";

export class RoomMessage extends Message<RoomMessage> {
    @Field.d(1, ChatMessage, "optional")
    public chat?: ChatMessage;

    @Field.d(2, MoveMessage, "optional")
    public move?: MoveMessage;

    @Field.d(3, JoinMessage, "optional")
    public join?: JoinMessage;

    @Field.d(4, JoinMessage, "optional")
    public exit?: ExitMessage;

    @OneOf.d("chat", "move", "join", "exit")
    public type: string;
}
