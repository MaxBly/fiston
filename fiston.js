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
const FistonTwit = require('./lib/fiston-twit');
//const FistonDjs = require('./lib/fiston-djs');
//const discordbot = new FistonDjs(process.env.DJS_TOKEN, time);
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
app.use('/', twitbot.router);
//twitbot.schedule(time);
twitbot.Tweet();

sio.on('connection', socket => {

    socket.on('getWords', _ => {
        Words.getWords((err, words) => {
            if (err) throw err;
            socket.emit('loadWords', words);
        });
    });

    socket.on('getReducedWords', _ => {
        Words.reducer((err, words) => {
            if (err) throw err;
            socket.emit('loadReducedWords', words);
        });
    });

    socket.on('save', W => {
        Words.addWord(W, (err, neW) => {
            if (err) throw err;
            console.log(neW);
            socket.emit('saveOk');
        });
    });

    socket.on('remove', i => {
        Words.removeWord({ index: i }, err => {
            if (err) throw err;
            socket.emit('removeOk');
        });
    });
});

server.listen(7000);

