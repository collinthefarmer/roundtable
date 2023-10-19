import { injectable } from "inversify";

@injectable()
export abstract class StorageService {
    abstract get<T>(id: string, type: new (...args: any) => T): T | null;

    abstract create<T>(id: string, data: T): T;
}

@injectable()
export class MemoryStorageService extends StorageService {
    store: Record<string, Record<string, any>> = {};

    create<T>(id: string, data: T): T {
        const typeKey = (data as any).constructor.name;

        if (!(typeKey in this.store)) {
            this.store[typeKey] = { [id]: data };
        } else {
            this.store[typeKey][id] = data;
        }

        return data;
    }

    get<T>(id: string, type: { new (...args: any): T }): T | null {
        return (this.store[type.name] ?? {})[id] ?? null;
    }
}
