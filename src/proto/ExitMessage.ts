import { Field, Message } from "protobufjs/light";

export class ExitMessage extends Message<ExitMessage> {
    @Field.d(0, "uint32", "required")
    public id: number;
}
