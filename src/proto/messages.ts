import { Field, Message, OneOf } from "protobufjs/light";

// Inner Message types

export class ChatMessage extends Message<ChatMessage> {
    static key = "chat" as const;

    @Field.d(10, "string", "required")
    public body: string;

    @Field.d(11, "uint32", "required")
    public reId: number;
}

export class JoinMessage extends Message<JoinMessage> {
    static key = "join" as const;

    @Field.d(10, "uint32", "required")
    public user: number;
}

export class ExitMessage extends Message<ExitMessage> {
    static key = "exit" as const;

    @Field.d(10, "uint32", "required")
    public user: number;
}

export class MoveMessage extends Message<MoveMessage> {
    static key = "move" as const;

    @Field.d(10, "uint32", "required")
    public x: number;

    @Field.d(11, "uint32", "required")
    public y: number;
}

export class TalkMessage extends Message<TalkMessage> {
    static key = "talk" as const;

    @Field.d(10, "uint32", "required")
    public user: number;
}

export class TickMessage extends Message<TickMessage> {
    static key = "tick" as const;

    @Field.d(10, "uint32", "required")
    public user: number;
}

// additional Message Messages

export class MessageMeta extends Message<MessageMeta> {
    @Field.d(0, "uint32", "required")
    public id: number;

    @Field.d(1, "uint32", "required")
    public timestamp: number;
}

export type MessageStaticType =
    | typeof ChatMessage
    | typeof JoinMessage
    | typeof ExitMessage
    | typeof MoveMessage
    | typeof TalkMessage
    | typeof TickMessage;

export type MessageTypeKey = MessageStaticType["key"];

export type MessageOfType<S extends MessageTypeKey> = Required<
    Omit<RoomMessage, Exclude<MessageTypeKey, S>>
>;

// Core Message Class

export class RoomMessage extends Message<RoomMessage> {
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
        return this.makeMessage(TalkMessage);
    }

    @Field.d(15, TickMessage, "optional")
    public tick?: TickMessage;

    static get Tick() {
        return this.makeMessage(TickMessage);
    }

    @OneOf.d("chat", "join", "exit", "move", "talk", "tick")
    public type: MessageTypeKey;

    reSource(source: number): Uint8Array {
        return RoomMessage.encode(
            new RoomMessage(
                Object.assign(this, {
                    source,
                }),
            ),
        ).finish();
    }

    private static makeMessage<M extends MessageStaticType>(m: M) {
        return (
            messageId: number,
            source: number,
            ...params: ConstructorParameters<M>
        ) =>
            RoomMessage.encode(
                new RoomMessage({
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
