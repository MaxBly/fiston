//require
const http = require('http');
const express = require('express');
const cors = require('cors');
//const wd = require('word-definition');
//const words = require('./json/words.json');

//const
require('dotenv').config();
const time = { h: 7, m: 30 };

//server

const app = express();
const server = http.createServer(app);
const sio = require("socket.io").listen(server);

//libs
const { Words } = require('./models/Words');
const { Guilds } = require('./models/Guilds');
const FistonTwit = require('./lib/fiston-twit');
const FistonDjs = require('./lib/fiston-djs');
const discordbot = new FistonDjs(process.env.DJS_TOKEN, time);
//Words.import(words);
//init
const twitbot = new FistonTwit({
    consumer: {
        key: process.env.TWIT_CONSUMER_KEY,
        secret: process.env.TWIT_CONSUMER_SECRET

    },
    access: {
        key: process.env.TWIT_ACCESS_KEY,
        secret: process.env.TWIT_ACCESS_SECRET
    }
});


//init server

app.use(cors());
//app.use('/', twitbot.router);
//twitbot.schedule(time);
//twitbot.Tweet();


process.on("unhandledRejection", error => {
    console.error("Unhandled promise rejection:", error);
});

sio.on('connection', socket => {

    socket.on('getWords', _ => {
        Words.getWords().then(words => socket.emit('loadWords', words))
            .catch(console.error);
    });

    socket.on('getReducedWords', _ => {
        Words.reducer().then(words => socket.emit('loadReducedWords', words))
            .catch(console.error);
    });

    socket.on('save', W => {
        Words.addWord(W).then(neW => console.log(neW) && socket.emit('saveOk'))
            .catch(console.error);
    });

    socket.on('remove', i => {
        Words.removeWord({ index: i }).then(_ => socket.emit('removeOk'))
            .catch(console.error);
    });
});

server.listen(7000);

