import { Container, decorate, injectable } from "inversify";
import { RoomService } from "./services/room.ts";
import { ClientService } from "./services/client.ts";
import { ConnectionService } from "./services/connection.ts";

decorate(injectable(), EventTarget);

export const container = new Container();
export const address = window.location.href.replace(/^http/, "ws");
container.bind(ConnectionService.ADDRESS).toConstantValue(address);
container.bind(ConnectionService).to(ConnectionService).inSingletonScope();
container.bind(RoomService).to(RoomService).inSingletonScope();
container.bind(ClientService).to(ClientService).inSingletonScope();
