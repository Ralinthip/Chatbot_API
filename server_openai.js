const express = require('express')
const mysql = require('mysql2')
const app = express()
const port = 3000

const OpenAI = require('openai')
const openai = new OpenAI({'apiKey': 'YOUR_API_KEY'});

//Database(MySql) configulation
const db = mysql.createConnection(
    {
        host: "localhost",
        user: "root",
        password: "1234",
        database: "shopdee"
    }
)
db.connect()

//Middleware (Body parser)
app.use(express.json())
app.use(express.urlencoded ({extended: true}))

// Function to execute a query with a promise-based approach
function query(sql, params) {
    return new Promise(function(resolve, reject) {
      db.query(sql, params, function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
}
  
//hello world
app.get('/', function(req, res){
    res.send('Hello World!')
});

//post message
app.post('/chat/post',  async function(req, res) {
  
    const {custID, message} = req.body;
    const empID = 0;    
    const sender = "c";
  
    let sql = 'INSERT INTO chat (custID, empID, message, sender) VALUES (?, ?, ?, ?)';
    await query(sql, [custID, empID, message, sender]);

    // The GPT models
    const response = await openai.chat.completions.create({
      messages: [
          { role: "system", content: "คุณเป็นผู้เชี่ยวชาญด้านฟุตบอล" },        
          { role: "user", content: message },
      ],
      model: "gpt-4o-mini",  
      max_tokens: 256  
    });    
    
    const text = response.choices[0].message.content;    
        
    sql = 'INSERT INTO chat (custID, empID, message, sender) VALUES (?, ?, ?,"e")';
    await query(sql, [custID, empID, text]);
      
    res.send({'message':'success','status':true});
  });
  

//show messages
app.get('/chat/show/:id', function(req, res){
    const custID = req.params.id;
    sql = `SELECT  message, sender,
                CASE
                  WHEN CAST(CURRENT_TIMESTAMP AS DATE) = SUBSTRING(chatTime,1,10) THEN CONCAT(DATE_FORMAT(chatTime, "%H.%i")," น.")
                  ELSE DATE_FORMAT(chatTime,"%d/%m")
                END AS chatTime 
                FROM chat 
                WHERE custID = ?
                ORDER BY msgID ASC`;  
    db.query(sql, [custID], function(err, result){
        if(err) throw err
        res.send(result)     
    })    
} )


app.listen(port, function() {
    console.log(`Example app listening on port ${port}`)
})
