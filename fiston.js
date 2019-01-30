//require
var http = require('http');
var express = require('express');
var sio = require("socket.io")(server, {
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
});


//const
require('dotenv').config();
var time = { h: 7, m: 30 };

//server
var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

//libs
var FistonTwit = require('./lib/fiston-twit');
var FistonDjs = require('./lib/fiston-djs');

//init
var twitbot = new FistonTwit(require('./json/tokens.json'));
var discordbot = new FistonDjs(process.env.TOKENS);

//init server
app.use('/fiston', twitbot.router);


twitbot.schedule(time);

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


/* todo discordbot
blybot.old
channelOMatic
settings file?
!motdujour schedule?
channel rt?
*/

/* twitbot.Tweet((err) => {
    console.log(err)
}) */


//login
discordbot.bot.login(process.env.TOKEN);
server.listen(7000);
