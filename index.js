'use strict';

const express = require('express');
const bodyParser = require('body-parser')
const version = require('./version');
const { Pool } = require('pg');

// Load environment
require('dotenv').config()

// Database pool
const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

// Application
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}));

const port = process.env.PORT || 8080;

// Route - default
app.get('/', (req, res) => {
  //res.status(200).send(JSON.stringify({ name: version.getName(), version: version.getVersion() }));

  //提供一个输入框，输入用户名
  //获取用户名后，调用 /users 接口，获取用户信息
  //显示用户信息
  //按照以上步骤，生成code
  res.send(`
  <form action="/users" method="get">
    <input type="text" name="q" />
    <input type="submit" value="Submit" />
  </form>
  `);
});

// Route - user search - with sql injection vulnerability
// can be exploited by passing in a query string like: ?q=' OR 1=1; --
// ' OR 1=1; --'   --> will be appended to the query, which will return all rows
app.get("/users", function (req, res) {
  let search = "";

  if (req?.query?.q) {
    search = req.query.q;
    console.log('q =' + search);
  }

  const squery = `SELECT * FROM users WHERE name = '${search}';`
  console.log('squery = ' + squery);
  pool.query(squery, (err, results) => {
    if (err) {
      console.log(err, results)
    }
    else {
      //res.send(results.rows)
      res.send(printResult(results));
    }
  });
});

//Route - user search - with sql injection fix
// app.get("/users/v2", function (req, res) {
//   let search = "";

//   if (req?.query?.q) {
//     search = req.query.q;
//     console.log('q =' + search);
//   }

//   const squery = 'SELECT * FROM users WHERE name = $1;';
//   console.log('squery = ' + squery);
//   pool.query(squery, [search], (err, results) => {
//     if (err) {
//       console.log(err, results)
//     }
//     else {
//       //res.send(results.rows)
//       res.send(printResult(results, 'squery = ' + squery));
//     }
//   });
// });

// Start the server
app.listen(port, () => {
  console.log(`Express app up and running on http://localhost:${port}`);
})

function printResult(results, squeryinfo) {
  let html = '<table border="1"><tr><th>id</th><th>name</th><th>address</th><th>phone</th></tr>';
  for (let row of results.rows) {
    html += '<tr>';
    html += '<td>' + row.id + '</td>';
    html += '<td>' + row.name + '</td>';
    html += '<td>' + row.address + '</td>';
    html += '<td>' + row.phone + '</td>';
    html += '</tr>';
  }
  html += '</table>';

  // 在html中再打印传入参数squeryinfo
  html += '<br>' + squeryinfo + '<br>';

  return html;
}