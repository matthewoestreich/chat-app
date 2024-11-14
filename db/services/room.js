export default {
  insert: insertRoom,
};

function insertRoom(db, roomName, id, tableName = "room") {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `INSERT INTO ${tableName} (id, name) VALUES (?, ?)`;

      db.run(query, [id, roomName], (err) => {
        if (err) {
          return reject(err);
        }
        return resolve({ roomName, id });
      });
    } catch (e) {
      return reject(e);
    }
  });
}
