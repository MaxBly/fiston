//require
var http = require('http');
var express = require('express');
var cors = require('cors');


//const
require('dotenv').config();
var time = { h: 7, m: 30 };

//server
var app = express();
var server = http.createServer(app);
var sio = require("socket.io").listen(server);

//libs
var FistonTwit = require('./lib/fiston-twit');
var FistonDjs = require('./lib/fiston-djs');

//init
var twitbot = new FistonTwit(require('./json/tokens.json'));
var discordbot = new FistonDjs(process.env.TOKEN);

//init server
app.use(cors());
app.use('/app', twitbot.router);


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
            console.log('added', { w, c });
        });
    });
});



/* twitbot.Tweet((err) => {
    console.log(err)
}) */


//login
server.listen(7000);
