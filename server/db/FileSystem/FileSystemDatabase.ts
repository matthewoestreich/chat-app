import nodePath from "node:path";
import nodeFs from "node:fs";
import Mutex from "@server/Mutex";
import { DirectConversation, DirectMessage, Message, Room, Session, User } from "@/types.shared";

export interface FileSystemDatabaseChatTable {
  userId: string;
  roomId: string;
}

export interface FileSystemDatabaseData {
  users: User[];
  chat: FileSystemDatabaseChatTable[];
  directConversations: DirectConversation[];
  directMessages: DirectMessage[];
  messages: Message[];
  room: Room[];
  session: Session[];
}

/**
 *
 */
export default class FileSystemDatabase {
  private databaseFilePath: string;
  private mut: Mutex = new Mutex();

  constructor(jsonFilePath: string) {
    if (!nodePath.basename(jsonFilePath).endsWith("json")) {
      throw new Error("jsonFilePath not a json file!");
    }
    if (!nodeFs.existsSync(jsonFilePath)) {
      nodeFs.writeFileSync(jsonFilePath, "{}");
    }
    this.databaseFilePath = jsonFilePath;
  }

  async read(): Promise<FileSystemDatabaseData> {
    if (!this.mut.isLocked) {
      throw new Error("Lock needed in order to read!");
    }
    try {
      if (!nodeFs.existsSync(this.databaseFilePath)) {
        throw new Error(`Database does not exist at : '${this.databaseFilePath}'`);
      }
      const data = nodeFs.readFileSync(this.databaseFilePath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      throw e;
    }
  }

  async write(data: FileSystemDatabaseData): Promise<void> {
    if (!this.mut.isLocked) {
      throw new Error("Lock needed in order to write!");
    }
    try {
      const jsonData = JSON.stringify(data, null, 2);
      nodeFs.writeFileSync(this.databaseFilePath, jsonData);
    } catch (e) {
      throw e;
    }
  }

  async selectTable<K extends keyof FileSystemDatabaseData>(table: K): Promise<FileSystemDatabaseData[K] | undefined> {
    await this.mut.lock();
    const data = await this.read();
    if (Array.isArray(data[table])) {
      this.mut.unlock();
      return data[table];
    }
    this.mut.unlock();
    return undefined;
  }

  async insert<K extends keyof FileSystemDatabaseData, T extends FileSystemDatabaseData[K][number]>(table: K, entity: T): Promise<T | undefined> {
    await this.mut.lock();
    try {
      const data = await this.read();
      if (Array.isArray(data[table])) {
        (data[table] as T[]).push(entity);
        await this.write(data);
        return entity;
      } else {
        throw new Error(`Table '${table}' does not exist or is not an array.`);
      }
    } finally {
      this.mut.unlock();
    }
  }

  async selectMany<K extends keyof FileSystemDatabaseData, T extends FileSystemDatabaseData[K][number], P extends keyof T>(table: K, property: P, value: T[P]): Promise<T[] | undefined> {
    await this.mut.lock();
    const data = await this.read();
    const foundTable = data[table];
    if (Array.isArray(foundTable)) {
      const filteredData = foundTable.filter((item) => (item as T)[property] === value) as T[] | undefined;
      this.mut.unlock();
      return filteredData;
    }
    return undefined;
  }

  async selectOne<K extends keyof FileSystemDatabaseData, T extends FileSystemDatabaseData[K][number], P extends keyof T>(table: K, property: P, value: T[P]): Promise<T | undefined> {
    await this.mut.lock();
    const data = await this.read();
    const foundTable = data[table];
    if (Array.isArray(foundTable)) {
      const found = foundTable.find((item) => (item as T)[property] === value) as T | undefined;
      this.mut.unlock();
      return found;
    }
    return undefined;
  }

  async selectManyWhere<K extends keyof FileSystemDatabaseData, T extends FileSystemDatabaseData[K][number]>(table: K, predicate: (entity: T) => boolean): Promise<T[]> {
    await this.mut.lock();
    try {
      const data = await this.read();
      const tableData = data[table] as T[];
      if (Array.isArray(tableData)) {
        return tableData.filter(predicate);
      }
      return [];
    } finally {
      this.mut.unlock();
    }
  }

  async selectOneWhere<K extends keyof FileSystemDatabaseData, T extends FileSystemDatabaseData[K][number]>(table: K, predicate: (entity: T) => boolean): Promise<T | undefined> {
    await this.mut.lock();
    try {
      const data = await this.read();
      const tableData = data[table] as T[];
      if (Array.isArray(tableData)) {
        return tableData.find(predicate);
      }
      return;
    } finally {
      this.mut.unlock();
    }
  }

  async setMany<K extends keyof FileSystemDatabaseData, T extends FileSystemDatabaseData[K][number], P extends keyof T>(table: K, searchProperty: P, searchValue: T[P], propertyToChange: keyof T, valueOfPropertyToChange: T[typeof propertyToChange]): Promise<void> {
    await this.mut.lock();
    try {
      const data = await this.read();
      const foundTable = data[table];

      if (Array.isArray(foundTable)) {
        const itemsToUpdate = foundTable.filter((item) => (item as T)[searchProperty] === searchValue) as T[];

        if (itemsToUpdate.length > 0) {
          itemsToUpdate.forEach((item) => {
            (item as T)[propertyToChange] = valueOfPropertyToChange;
          });

          await this.write(data);
        } else {
          throw new Error(`No items found matching ${searchProperty.toString()}: '${searchValue}'`);
        }
      } else {
        throw new Error(`Table '${table}' does not exist or is not an array.`);
      }
    } finally {
      this.mut.unlock();
    }
  }

  async setOne<K extends keyof FileSystemDatabaseData, T extends FileSystemDatabaseData[K][number], P extends keyof T>(table: K, searchProperty: P, searchValue: T[P], propertyToChange: keyof T, valueOfPropertyToChange: T[typeof propertyToChange]): Promise<void> {
    await this.mut.lock();
    try {
      const data = await this.read();
      const foundTable = data[table];

      if (Array.isArray(foundTable)) {
        const itemToUpdate = foundTable.find((item) => (item as T)[searchProperty] === searchValue) as T;

        if (itemToUpdate) {
          (itemToUpdate as T)[propertyToChange] = valueOfPropertyToChange;

          await this.write(data);
        } else {
          throw new Error(`No items found matching ${searchProperty.toString()}: '${searchValue}'`);
        }
      } else {
        throw new Error(`Table '${table}' does not exist or is not an array.`);
      }
    } finally {
      this.mut.unlock();
    }
  }

  async deleteMany<K extends keyof FileSystemDatabaseData, T extends FileSystemDatabaseData[K][number], P extends keyof T>(table: K, property: P, value: T[P]): Promise<void> {
    await this.mut.lock();
    try {
      const data = await this.read();
      const foundTable = data[table];

      if (Array.isArray(foundTable)) {
        // Filter out the items that match the condition
        data[table] = foundTable.filter((item) => (item as T)[property] !== value) as FileSystemDatabaseData[K];

        // Write back the updated data
        await this.write(data);
      }
    } finally {
      this.mut.unlock();
    }
  }

  async deleteOneWhere<K extends keyof FileSystemDatabaseData, T extends FileSystemDatabaseData[K][number]>(table: K, predicate: (entity: T) => boolean): Promise<boolean> {
    await this.mut.lock();
    try {
      const data = await this.read();
      const tableData = data[table] as T[];
      if (Array.isArray(tableData)) {
        const found = tableData.find(predicate);
        if (!found) {
          return false;
        }
        (data[table] as T[]) = tableData.filter((td) => td !== found);
        await this.write(data);
        return true;
      }
      return false;
    } finally {
      this.mut.unlock();
    }
  }
}
