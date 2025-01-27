Thanks for your interest!

# Adding DatabaseProvider

You can follow the setup in [/server/db/SQLite/](/server/db/SQLite/) or [/server/db/InMemory](/server/db/InMemory/) as a guide.

Create classes that satisfy these interfaces (note: look in `/types/database.d.ts` for update intefaces, the examples below may be old and not updated):

```ts
interface DatabasePoolConnection<T> {
  db: T;
  id: string;
  release(): void;
}

interface DatabasePool<T> {
  getConnection(): Promise<DatabasePoolConnection<T>>;
  releaseConnection(connection: DatabasePoolConnection<T>): void;
}

interface RoomsRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<Room[]>;
  getById(id: string): Promise<Room>;
  create(name: string, isPrivate?: 0 | 1): Promise<Room>;
  update(id: string, entity: Room): Promise<Room | null>;
  delete(id: string): Promise<boolean>;
  selectUnjoinedRooms(userId: string): Promise<Room[]>;
  addUserToRoom(userId: string, roomId: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<Room[]>;
  removeUserFromRoom(userId: string, roomId: string): Promise<boolean>;
  selectRoomsWithMembersByUserId(userId: string): Promise<RoomWithMembers[]>;
  selectRoomMembersExcludingUser(roomId: string, excludingUserId: string): Promise<RoomMember[]>;
  selectRoomMembersByRoomId(roomId: string): Promise<RoomMember[]>;
}

interface AccountsRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<Account[]>;
  getById(id: string): Promise<Account>;
  create(name: string, passwd: string, email: string): Promise<Account>;
  update(id: string, entity: Account): Promise<Account | null>;
  delete(id: string): Promise<boolean>;
  selectByEmail(email: string): Promise<Account>;
}

interface DirectConversationsRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<DirectConversation[]>;
  getById(id: string): Promise<DirectConversation>;
  create(userA_id: string, userB_id: string): Promise<DirectConversation>;
  update(id: string, entity: DirectConversation): Promise<DirectConversation | null>;
  delete(id: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<DirectConversationByUserId[]>;
  selectInvitableUsersByUserId(userId: string): Promise<PublicAccount[]>;
}

interface DirectMessagesRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<DirectMessage[]>;
  getById(id: string): Promise<DirectMessage>;
  create(entity: DirectMessage): Promise<DirectMessage>;
  update(id: string, entity: DirectMessage): Promise<DirectMessage | null>;
  delete(id: string): Promise<boolean>;
  selectByDirectConversationId(directConversationId: string): Promise<DirectMessage[]>;
}

interface RoomsMessagesRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<Message[]>;
  getById(id: string): Promise<Message>;
  create(roomId: string, userId: string, message: string): Promise<Message>;
  update(id: string, entity: Message): Promise<Message | null>;
  delete(id: string): Promise<boolean>;
  selectByRoomId(roomId: string): Promise<Message[]>;
}

interface SessionsRepository<DB> extends Repository<Session> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<Session[]>;
  getById(id: string): Promise<Session>;
  create(userId: string, sessionToken: string): Promise<Session>;
  update(id: string, entity: Session): Promise<Session | null>;
  delete(id: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<Session | undefined>;
  deleteByUserId(userId: string): Promise<boolean>;
  upsert(userId: string, token: string): Promise<boolean>;
}

interface DatabaseProvider {
  databasePool: DatabasePool<DB>;
  rooms: RoomsRepository<DB>;
  roomMessages: RoomsMessagesRepository<DB>;
  accounts: AccountsRepository<DB>;
  directConversations: DirectConversationsRepository<DB>;
  directMessages: DirectMessagesRepository<DB>;
  sessions: SessionsRepository<DB>;
  initialize(): Promise<void>;
  seed(): Promise<void>;
  backup(): Promise<void>;
  restore(): Promise<void>;
}
```

Putting this comment here for reference as well, from [DatabaseProviderConfigLoader.ts](/server/db/DatabaseProviderConfigLoader.ts):

```ts
/**
 * =======================================================================================================================
 * Summary of the setup:
 * -----------------------------------------------------------------------------------------------------------------------
 * PROVIDER PARAMS: The `DatabaseProviderConfigRegistry` is used to hold any params your provider may have
 * -----------------------------------------------------------------------------------------------------------------------
 * CONFIG LOADER: Add your providers params as switch case.
 * -----------------------------------------------------------------------------------------------------------------------
 * FACTORY: Where you actually add creating a new instance of your provider, as a switch case.
 * -----------------------------------------------------------------------------------------------------------------------
 * =======================================================================================================================
 * 
 * 
 * =======================================================================================================================
 * -----------------------------------------------------------------------------------------------------------------------
 * - An Entry Requires Two Things -
 * -----------------------------------------------------------------------------------------------------------------------
 *  1. (key) Name of provider
 *  2. (object) Parameters that are passed to `new YourConfigProvider(<params>)`. The
 *     keys in the parameters object that you provide MUST MATCH THE PARAMETER
 *     NAMES ON THE CLASS/FUNCTION/METHOD THAT CREATES YOUR PROVIDER!
 * =======================================================================================================================
 *
 *
 * =======================================================================================================================
 * -----------------------------------------------------------------------------------------------------------------------
 * - Example of a New Provider -
 * -----------------------------------------------------------------------------------------------------------------------
 * 
 * Lets say I want to add a new database called `BestDB` that requires
 * a connection string. We would also like to have a limit on max pool connections.
 * 
 * !!!!!! NOTE: If your provider requires no params, use `unknown` !!!!
 * 
 * Also, the key that you use is how the config loader selects your provider, based upon `process.env.DATABASE_PROVIDER`. So,
 * if you use `bestdb` as the key, when `process.env.DATABASE_PROVIDER === "bestdb"` we will use your database provider.
 *
 * ```
 * export type DatabaseProviderConfigRegistry = {
 *    // other providers removed for brevity
 *    bestdb: {
 *      connectionString: string;
 *      maxConnections: number;
 *    },
 *    // !!!!!! NOTE: If your provider requires no params, use `unknown` !!!!
 *    otherProvider: unknown;
 * }
 * ```
 * 
 * Next, add to factory (in DatabaseProviderFactory.ts):
 * 
 * ```
 * // In `DatabaseProviderFactory.ts`
 *  private static providerInitializers: DatabaseProviderInitializers = {
 *    sqlite: (config) => new SQLiteProvider(config.databaseFilePath, config.maxConnections),
 *    memory: (_config) => new InMemoryProvider(),
 *    // ADD NEW PROVIDER HERE
 *  };
 * ```
 * =======================================================================================================================
 *
 */
```

After that you'll need to add your provider to the "registry", config loader, and database provider factory:

Adding to registry/config loader:

```ts
// /server/db/DatabaseProviderConfigLoader.ts
export type DatabaseProviderConfigRegistry = {
  sqlite: {
    databaseFilePath: string;
    maxConnections: number;
  };
  memory: unknown;
  // ADD YOUR NEW PROVIDERS PARAMS HERE
};

export type DatabaseProviderConfig<T extends keyof DatabaseProviderConfigRegistry> = {
  type: T;
  config: DatabaseProviderConfigRegistry[T];
};

export default class DatabaseProviderConfigLoader {
  static loadConfig(databaseProvider: string): DatabaseProviderConfig<keyof DatabaseProviderConfigRegistry> {
    switch (databaseProvider) {
      case "sqlite": {
        const databaseFilePath = somePath;
        return {
          type: "sqlite",
          config: { databaseFilePath, maxConnections: 5 },
        };
      }
      case "memory": {
        return {
          type: "memory",
          config: {},
        };
      }
      // ADD YOUR NEW PROVIDER HERE
      default: {
        console.warn(`DATABASE_PROVIDER was not found. Using "in-memory" store. DATA WILL NOT BE SAVED AFTER SERVER IS STOPPED!`);
        return {
          type: "memory",
          config: {},
        };
      }
    }
  }
}
```

Adding to factory:

```ts
// /server/db/DatabaseProviderFactory.ts
export default class DatabaseProviderFactory {
  private static providerInitializers: DatabaseProviderInitializers = {
    sqlite: (config) => new SQLiteProvider(config.databaseFilePath, config.maxConnections),
    memory: (_config) => new InMemoryProvider(),
    // ADD HERE
  };

  static createProvider<T extends keyof DatabaseProviderConfigRegistry>(config: DatabaseProviderConfig<T>): DatabaseProvider {
    const initializer = this.providerInitializers[config.type];
    if (!initializer) {
      throw new Error(`Unknown provider type: ${config.type}`);
    }
    return initializer(config.config);
  }
}
```


