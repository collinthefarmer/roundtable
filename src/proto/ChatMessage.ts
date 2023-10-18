import { Field, Message } from "protobufjs/light";

export class ChatMessage extends Message<ChatMessage> {
    @Field.d(4, "int64", "required")
    public id: number;

    @Field.d(1, "string", "required")
    public body: string;

    @Field.d(2, "int64", "required")
    public timestamp: number = new Date().getTime();

    @Field.d(3, "string", "required")
    public isReplyTo: number;

    get localeTimeString(): string {
        return new Date(this.timestamp).toLocaleTimeString();
    }

    createReply(body: string): ChatMessage {
        return new ChatMessage({ body, isReplyTo: this.id });
    }
}
