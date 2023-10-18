import { Field, Message } from "protobufjs/light";

export class JoinMessage extends Message<JoinMessage> {
    @Field.d(0, "uint32", "required")
    public id: number;
}