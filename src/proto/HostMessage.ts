import { Field, Message } from "protobufjs/light";
import { RoomMessage } from "./RoomMessage.ts";

export class HostMessage extends Message<HostMessage> {
    @Field.d(1, "uint32", "required")
    public source: number;

    @Field.d(2, RoomMessage, "required")
    public message: RoomMessage;
}
