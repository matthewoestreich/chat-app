import { v7 as uuidV7 } from "uuid";
import sqlite3 from "sqlite3";
import { DirectConversation, PublicDirectConversation, PublicMember } from "@root/types.shared";
import { DatabasePool, DirectConversationsRepository } from "@server/types";
import TABLE from "../../tables";

export default class DirectConversationsRepositorySQLite implements DirectConversationsRepository<sqlite3.Database> {
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async addUserToDirectConversation(directConversationId: string, userId: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `
          INSERT INTO ${TABLE.directConversationMemberships} 
            (id, directConversationId, userId, isMember) 
          VALUES 
            (?, ?, ?, ?)
          ON 
            CONFLICT(directConversationId, userId) 
          DO 
            UPDATE 
          SET 
            isMember = true, leftAt = NULL;`;
        const params = [uuidV7(), directConversationId, userId, true];
        db.run(query, params, (error: Error | null) => {
          release();
          if (error) {
            reject(error);
          }
          resolve(true);
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  async removeUserFromDirectConversation(directConversationId: string, userId: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `
          UPDATE 
            ${TABLE.directConversationMemberships}
          SET 
            isMember = 0, 
            leftAt = CURRENT_TIMESTAMP
          WHERE 
            directConversationId = ? 
          AND
            userId = ?;
        `;
        const params = [directConversationId, userId];
        db.run(query, params, (error: Error | null) => {
          release();
          if (error) {
            reject(error);
          }
          resolve(true);
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  async selectByUserId(userId: string): Promise<PublicDirectConversation[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `
        SELECT 
          dc.id AS scopeId, 
          u.id AS userId, 
          u.user_name AS userName
        FROM 
          ${TABLE.directConversations} dc
        JOIN 
          ${TABLE.directConversationMemberships} dcm 
        ON 
            dc.id = dcm.directConversationId
        JOIN 
          ${TABLE.users} u
        ON 
          u.id = 
          CASE 
            WHEN dc.userAId = dcm.userId THEN dc.userBId 
            ELSE dc.userAId 
          END
        WHERE 
          dcm.userId = ?
        AND 
          dcm.isMember = true
        ORDER BY u.user_name COLLATE NOCASE ASC;
      `;
        db.all(query, [userId], (err, rows: PublicDirectConversation[]) => {
          release();
          if (err) {
            return reject(err);
          }
          return resolve(rows);
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  async selectInvitableUsersByUserId(userId: string): Promise<PublicMember[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `
        SELECT 
          u.id AS userId, 
          u.user_name AS userName
        FROM 
          ${TABLE.users} u
        WHERE 
          u.id != ?
        AND 
          u.id NOT IN (
            SELECT 
              CASE 
                WHEN dc.userAId = ? THEN dc.userBId
                ELSE dc.userAId
              END
            FROM 
              ${TABLE.directConversations} dc
            JOIN 
              ${TABLE.directConversationMemberships} dcm
            ON 
              dc.id = dcm.directConversationId
            WHERE 
              dcm.userId = ? 
            AND
              dcm.isMember = true
          )
        ORDER BY u.user_name COLLATE NOCASE ASC;
      `;
        db.all(query, [userId, userId, userId], (err, rows: PublicMember[]) => {
          release();
          if (err) {
            return reject(err);
          }
          return resolve(rows);
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  getAll(): Promise<DirectConversation[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<DirectConversation> {
    throw new Error("Method not implemented.");
  }

  /**
   * CALLER IS EXPECTED TO RELEASE DB CONNECTION
   * @param userAId
   * @param userBId
   * @param db
   * @returns
   */
  private async selectDirectConversationByParticipantIds(userAId: string, userBId: string, db: sqlite3.Database): Promise<DirectConversation | null> {
    return new Promise((resolve, reject) => {
      try {
        const query = `
          SELECT * FROM direct_conversations dc 
          WHERE 
            (dc.userAId = ? AND dc.userBId = ?)
            OR
            (dc.userAId = ? AND dc.userBId = ?);
        `;
        db.get(query, [userAId, userBId, userBId, userAId], (err: Error | null, row: DirectConversation) => {
          if (err) {
            reject(err);
          }
          resolve(row);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async create(userAId: string, userBId: string): Promise<DirectConversation> {
    const { db, release } = await this.databasePool.getConnection();
    const entity: DirectConversation = { id: uuidV7(), userAId, userBId };

    return new Promise(async (resolve, reject) => {
      try {
        const existing = await this.selectDirectConversationByParticipantIds(userAId, userBId, db);
        if (existing) {
          return resolve(existing);
        }
        const query = `
          INSERT INTO ${TABLE.directConversations} 
            (id, userAId, userBId) 
          VALUES 
            (?, ?, ?);`;
        db.run(query, [entity.id, entity.userAId, entity.userBId], async (err) => {
          release();
          if (err) {
            return reject(err);
          }
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

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented!");
  }
}
