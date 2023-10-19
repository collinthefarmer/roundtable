import { Field, Message, OneOf } from "protobufjs/light";

export class ChatMessage extends Message<ChatMessage> {
    static key: string = "chat";

    @Field.d(10, "string", "required")
    public body: string;

    @Field.d(11, "uint32", "required")
    public reId: number;
}

export class JoinMessage extends Message<JoinMessage> {
    static key: string = "join";

    @Field.d(10, "uint32", "required")
    public user: number;
}

export class ExitMessage extends Message<ExitMessage> {
    static key: string = "exit";

    @Field.d(10, "uint32", "required")
    public user: number;
}

export class MoveMessage extends Message<MoveMessage> {
    static key: string = "move";

    @Field.d(10, "uint32", "required")
    public x: number;

    @Field.d(11, "uint32", "required")
    public y: number;
}

export class TalkMessage extends Message<TalkMessage> {
    static key: string = "talk";

    @Field.d(10, "bytes", "required")
    public blob: Uint8Array;
}

export class MessageMeta extends Message<MessageMeta> {
    @Field.d(0, "uint32", "required")
    public id: number;

    @Field.d(1, "uint32", "required")
    public timestamp: number;
}

export type MessageType =
    | typeof ChatMessage
    | typeof JoinMessage
    | typeof ExitMessage
    | typeof MoveMessage
    | typeof TalkMessage;

export class HostMessage extends Message<HostMessage> {
    @Field.d(0, MessageMeta, "required")
    public meta: MessageMeta;

    @Field.d(1, "uint32", "required")
    public source: number;

    @Field.d(10, ChatMessage, "optional")
    public chat?: ChatMessage;

    static get Chat() {
        return this.makeMessage(ChatMessage);
    }

    @Field.d(11, JoinMessage, "optional")
    public join?: JoinMessage;

    static get Join() {
        return this.makeMessage(JoinMessage);
    }

    @Field.d(12, ExitMessage, "optional")
    public exit?: ExitMessage;

    static get Exit() {
        return this.makeMessage(ExitMessage);
    }

    @Field.d(13, MoveMessage, "optional")
    public move?: MoveMessage;

    static get Move() {
        return this.makeMessage(MoveMessage);
    }

    @Field.d(14, TalkMessage, "optional")
    public talk?: TalkMessage;

    static get Talk() {
        return this.makeMessage(ExitMessage);
    }

    @OneOf.d("chat", "join", "exit", "move", "talk")
    public type: string;

    reSource(source: number): Uint8Array {
        return HostMessage.encode(
            new HostMessage(
                Object.assign(this, {
                    source,
                }),
            ),
        ).finish();
    }

    private static makeMessage<M extends MessageType>(m: M) {
        return (
            messageId: number,
            source: number,
            ...params: ConstructorParameters<M>
        ) =>
            HostMessage.encode(
                new HostMessage({
                    source,
                    meta: new MessageMeta({
                        id: messageId,
                        timestamp: new Date().getTime(),
                    }),
                    [m.key]: new m(...params),
                    type: m.key,
                }),
            ).finish();
    }
}
