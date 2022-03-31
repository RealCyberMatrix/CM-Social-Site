import mysql from 'mysql';

const connection = mysql.createConnection({
  host: process.env.RDS_HOST,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASS,
  database : process.env.RDS_DB
});


export default function getTokenDetails (tokenIds: Number[], cb: CallableFunction) {
    console.log('tokenId: ', tokenIds);
    connection.connect(err => {
      if (err) {
        // console.error('error connecting: ' + err.stack);
        cb(err, null);
        return;
      }
    
      // console.log('connected as threadId ' + connection.threadId);
      // In order to avoid SQL Injection attacks, you should always escape any user provided data before using it inside a SQL query.
      connection.query('SELECT * FROM tokens WHERE id IN (?)', [tokenIds], (error, results, fields) => {
        connection.end();
        if (error) {
          // console.log(error);
          cb(error, null);
          return;
        }
        cb(null, results);
      });
    });
}

