//require
var http = require('http');
var express = require('express');
var socketio = require('socket.io');

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

io.sockets.on('connection', socket => {

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
