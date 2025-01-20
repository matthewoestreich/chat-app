import sqlite3 from "sqlite3";
sqlite3.verbose();

export default {
  selectByConversationId,
};

function selectByConversationId(db: sqlite3.Database, convoId: string): Promise<DirectMessage[]> {
  return new Promise((resolve, reject) => {
    try {
      const query = `
        SELECT dm.*, u.name AS fromUserName
        FROM direct_messages dm 
        JOIN "user" u
        ON u.id = dm.fromUserId 
        WHERE dm.directConversationId = ?
        ORDER BY timestamp ASC;`;
      db.all(query, [convoId], (err, rows: DirectMessage[]) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    } catch (e) {
      reject(e);
    }
  });
}
