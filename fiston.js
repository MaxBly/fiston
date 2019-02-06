//require
const http = require('http');
const express = require('express');
const cors = require('cors');


//const
require('dotenv').config();
const time = { h: 7, m: 30 };

//server
const app = express();
const server = http.createServer(app);
const sio = require("socket.io").listen(server);

//libs
const FistonTwit = require('./lib/fiston-twit');
const FistonDjs = require('./lib/fiston-djs');

//init
const twitbot = new FistonTwit(require('./json/tokens.json'));
const discordbot = new FistonDjs(process.env.TOKEN);

//init server
app.use(cors());
app.use('/', twitbot.router);


twitbot.schedule(time);
discordbot.schedule(time);

sio.on('connection', socket => {

    socket.on('getWords', _ => {
        twitbot.getWords((err, words) => {
            if (err) throw err;
            socket.emit('loadWords', words);
        });
    });

    socket.on('save', ({ w, c }) => {
        twitbot.addWord(w, c, err => {
            if (err) throw err;
            socket.emit('saveOk');
        });
    });
});



/* twitbot.Tweet((err) => {
    console.log(err)
}) */


//login
server.listen(7000);
