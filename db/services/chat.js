export default {
  selectRoomsByUserId: selectAllRoomsByUserId,
};

function selectAllRoomsByUserId(db, userId, tableName = "chat", roomTableName = "room") {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT r.id, r.name
      FROM ${roomTableName} r
      JOIN ${tableName} c ON r.id = c.roomId
      WHERE c.userId = ?
    `;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        return reject(err);
      }

      return resolve(rows);
    });
  });
}
