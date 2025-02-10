import { v7 as uuidV7 } from "uuid";
import sqlite3 from "sqlite3";
import { DirectConversation, PublicDirectConversation, PublicMember } from "@root/types.shared";
import { DatabasePool, DirectConversationsRepository } from "@server/types";
import tableNames from "../../tableNames";

export default class DirectConversationsRepositorySQLite implements DirectConversationsRepository<sqlite3.Database> {
  private TABLE_NAME = tableNames.directConversations;
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async selectByUserId(userId: string): Promise<PublicDirectConversation[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      const query = `
      SELECT dc.id AS scopeId, u.id AS userId, u.user_name AS userName
      FROM ${this.TABLE_NAME} dc
      JOIN ${tableNames.users} u 
      ON dc.otherParticipantUserId = u.id
      WHERE dc.createdByUserId = ? 
      ORDER BY userName ASC;
      `;
      db.all(query, [userId], (err, rows: PublicDirectConversation[]) => {
        if (err) {
          release();
          return reject(err);
        }
        release();
        return resolve(rows);
      });
    });
  }

  async selectInvitableUsersByUserId(userId: string): Promise<PublicMember[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      const query = `
      SELECT u.id as userId, u.user_name AS userName FROM ${tableNames.users} u WHERE u.id != ?
      AND u.id NOT IN (
        SELECT dc.otherParticipantUserId from ${this.TABLE_NAME} dc WHERE dc.createdByUserId = ?
      )
      ORDER BY u.user_name ASC;
      `;
      db.all(query, [userId, userId], (err, rows: PublicMember[]) => {
        if (err) {
          release();
          console.log(err);
          return reject(err);
        }
        release();
        return resolve(rows);
      });
    });
  }

  getAll(): Promise<DirectConversation[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<DirectConversation> {
    throw new Error("Method not implemented.");
  }

  async create(createdByUserId: string, otherParticipantUserId: string): Promise<DirectConversation> {
    const { db, release } = await this.databasePool.getConnection();
    const entity: DirectConversation = { id: uuidV7(), createdByUserId, otherParticipantUserId };

    return new Promise((resolve, reject) => {
      try {
        const query = `INSERT INTO ${this.TABLE_NAME} (id, createdByUserId, otherParticipantUserId) VALUES (?, ?, ?)`;
        db.run(query, [entity.id, entity.createdByUserId, entity.otherParticipantUserId], async (err) => {
          if (err) {
            release();
            return reject(err);
          }
          release();
          return resolve(entity);
        });
      } catch (e) {
        release();
        return reject(e);
      }
    });
  }

  update(_id: string, _entity: DirectConversation): Promise<DirectConversation | null> {
    throw new Error("Method not implemented.");
  }

  // Remove direct conversation for user
  async removeUserFromDirectConversation(idOfUserThatRequestedRemoval: string, convoId: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();

    // TODO we prob need to restructure the database.
    // As it stands, if I am in a direct convo with you, and you leave the convo, it also removes the convo
    // from my display.
    return new Promise((resolve, reject) => {
      try {
        const query = `DELETE from ${this.TABLE_NAME} WHERE id = ? AND createdByUserId = ?`;
        const params = [convoId, idOfUserThatRequestedRemoval];
        db.run(query, params, function (err) {
          if (err) {
            release();
            return reject(err);
          }
          release();
          return resolve(true);
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented!");
  }
}
