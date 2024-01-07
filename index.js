const http=require("http");
const express =require("express");
const cors = require("cors");
const socketIO = require("socket.io");
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const url = '';
const dbName = 'database1';
const collectionName = 'chat_data';
const client = new MongoClient(url);
const app=express();
app.use(express.json());
app.use(cors());
const port= process.env.PORT||3001 ;
const users=[{}];

app.use(cors());
app.get("/",(req,res)=>{
    res.send("hello sir 🤡🤡🤡");
})

const server=http.createServer(app);

const io=socketIO(server,{
    maxHttpBufferSize: 1e8 
  });
  app.get('/data', async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const rows = await collection.find().toArray();
        await client.close();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred' });
    }
});

io.on("connection", (socket)=>{
    console.log("New Connection");
    socket.on('joined',({user,id})=>{
          users[socket.id]=user;
          console.log(`${user} has joined `);
          socket.broadcast.emit('userJoined',{user:"Admin",data:` ${users[socket.id]} has joined`,id:id});
          socket.emit('welcome',{user:"Admin",data:`Welcome to the chat`,id:id})
    })
    socket.on('stream', (stream) => {
        socket.broadcast.emit('stream', stream);
      });
     socket.on('msg',async({data,id,time, image,link,mobile_no})=>{
        console.log({data,id,time, image,link,mobile_no});
        io.emit('sendMessage',{user:users[id],data,id,time,image,link,mobile_no});
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const result = await collection.insertOne({data,id,time, image,link,mobile_no});
        
    })

    socket.on('disconnect',()=>{
          socket.broadcast.emit('leave',{user:"Admin",data:`${users[socket.id]}  has left`});
        console.log(`user left`);
    })
});


server.listen(port,()=>{
    console.log(`Working`);
})