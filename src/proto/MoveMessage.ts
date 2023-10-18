import { Field, Message } from "protobufjs/light";

export class MoveMessage extends Message<MoveMessage> {
    @Field.d(0, "uint32", "required")
    public x: number;

    @Field.d(1, "uint32", "required")
    public y: number;
}
