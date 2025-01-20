import sqlite3 from "sqlite3";

export default {
  insert,
  selectAllByUserId,
  selectInvitableUsers,
};

function insert(db: sqlite3.Database, conversationId: string, userA_Id: string, userB_Id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const query = `INSERT INTO direct_conversation (id, userA_id, userB_id) VALUES (?, ?, ?)`;

      db.run(query, [conversationId, userA_Id, userB_Id], async (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    } catch (e) {
      return reject(e);
    }
  });
}

function selectAllByUserId(db: sqlite3.Database, userId: string): Promise<DirectConversation[]> {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT dc.id AS id, u.id AS userId, u.name AS userName
    FROM direct_conversation dc
    JOIN "user" u 
    ON u.id = CASE WHEN dc.userA_Id = ? THEN dc.userB_Id ELSE dc.userA_Id END
    WHERE ? IN (dc.userA_Id, dc.userB_Id)
    ORDER BY userName ASC;
    `;
    db.all(query, [userId, userId], (err, rows: DirectConversation[]) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
}

function selectInvitableUsers(db: sqlite3.Database, userId: string): Promise<Account[]> {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT u.id, u.name FROM "user" u WHERE u.id != ?
    AND u.id NOT IN (
        SELECT userA_Id FROM direct_conversation WHERE userB_Id = ?
        UNION
        SELECT userB_Id FROM direct_conversation WHERE userA_Id = ?
    );
    `;
    db.all(query, [userId, userId, userId], (err, rows: Account[]) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
}
