import { v7 as uuidV7 } from "uuid";
import sqlite3 from "sqlite3";
import { DirectConversation, PublicDirectConversation, PublicMember } from "@root/types.shared";
import { DatabasePool, DirectConversationsRepository } from "@server/types";

export default class DirectConversationsRepositorySQLite implements DirectConversationsRepository<sqlite3.Database> {
  private TABLE_NAME = "direct_conversations";
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async selectByUserId(userId: string): Promise<PublicDirectConversation[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      const query = `
      SELECT dc.id AS scopeId, u.id AS userId, u.name AS userName
      FROM ${this.TABLE_NAME} dc
      JOIN users u 
      ON u.id = CASE WHEN dc.userA_Id = ? THEN dc.userB_Id ELSE dc.userA_Id END
      WHERE ? IN (dc.userA_Id, dc.userB_Id)
      ORDER BY userName ASC;
      `;
      db.all(query, [userId, userId], (err, rows: PublicDirectConversation[]) => {
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
      SELECT u.id as userId, u.name AS userName FROM "user" u WHERE u.id != ?
      AND u.id NOT IN (
          SELECT userA_Id FROM ${this.TABLE_NAME} WHERE userB_Id = ?
          UNION
          SELECT userB_Id FROM ${this.TABLE_NAME} WHERE userA_Id = ?
      )
      ORDER BY u.name ASC;
      `;
      db.all(query, [userId, userId, userId], (err, rows: PublicMember[]) => {
        if (err) {
          release();
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

  async create(userA_id: string, userB_id: string): Promise<DirectConversation> {
    const { db, release } = await this.databasePool.getConnection();
    const entity: DirectConversation = { id: uuidV7(), userA_id, userB_id };

    return new Promise((resolve, reject) => {
      try {
        const query = `INSERT INTO ${this.TABLE_NAME} (id, userA_id, userB_id) VALUES (?, ?, ?)`;
        db.run(query, [entity.id, entity.userA_id, entity.userB_id], async (err) => {
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
        const query = `DELETE from ${this.TABLE_NAME} WHERE id = ? AND userA_Id = ? OR userB_Id = ?`;
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
