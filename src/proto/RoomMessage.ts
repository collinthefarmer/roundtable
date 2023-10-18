import { Field, Message, OneOf } from "protobufjs/light";
import { ChatMessage } from "./ChatMessage.ts";
import { MoveMessage } from "./MoveMessage.ts";

export class RoomMessage extends Message<RoomMessage> {
    @Field.d(1, ChatMessage, "optional")
    public chat?: ChatMessage;

    @Field.d(2, MoveMessage, "optional")
    public move?: MoveMessage;

    @OneOf.d("chat", "move")
    public type: string;
}
