import sqlite3 from "sqlite3";
sqlite3.verbose();

export default {
  selectByConversationId,
};

function selectByConversationId(db: sqlite3.Database, convoId: string): Promise<DirectMessage[]> {
  return new Promise((resolve, reject) => {
    try {
      db.all(`SELECT * from direct_messages WHERE directConversationId = ? ORDER BY timestamp ASC`, [convoId], (err, rows: DirectMessage[]) => {
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
