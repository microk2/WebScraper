const mysql = require("mysql");
const settings = require("./settings.json");
const db = mysql.createConnection(settings.database);

const getDataFromDB = async (query, entry) => {
  return new Promise((resolve, reject) => {
    db.query(query, [entry], (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
};

db.connect((err) => {
  if (err) throw new Error(err);
});

module.exports = {
  db: db,
  getDataFromDB: getDataFromDB,
};
