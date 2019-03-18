//require
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import socket from "socket.io";
//const wd = require('word-definition');
//const words = require('./json/words.json');

//const
dotenv.config();

//server

const app = express();
const server = http.createServer(app);
let sio = socket.listen(server);

//libs
import { Words } from "./models/Words"
import { Guilds } from "./models/Guilds"
import { TwitBot as FistonTwit, time } from "./lib/fiston-twit"
import FistonDjs from "./lib/fiston-djs"
//Words.setNext(103);
//init
const time: time = { h: 17, m: 42 };
const discordbot = new FistonDjs(process.env.DJS_TOKEN);
const twitbot = new FistonTwit({
    consumer: {
        key: process.env.TWIT_CONSUMER_KEY,
        secret: process.env.TWIT_CONSUMER_SECRET

    },
    access: {
        key: process.env.TWIT_ACCESS_KEY,
        secret: process.env.TWIT_ACCESS_SECRET
    }
}, time);

//init server

app.use(cors());
app.use('/', twitbot.router);
(async () => {
    //await twitbot.Tweet()
})()

process.on("unhandledRejection", error => {
    console.error("Unhandled promise rejection:", error);
});

sio.on('connection', (socket: any) => {

    socket.on('getWords', () => {
        Words.getWords({}).then((words: any) => socket.emit('loadWords', words))
            .catch(console.error);
    });

    socket.on('getReducedWords', () => {
        Words.reducer().then(words => socket.emit('loadReducedWords', words))
            .catch(console.error);
    });

    socket.on('save', (W: any) => {
        Words.addWord(W).then((neW: any) => {
            console.log(neW);
            socket.emit('saveOk')
        })
            .catch(console.error);
    });

    socket.on('remove', (i: any) => {
        Words.removeWord({ index: i }).then(() => socket.emit('removeOk'))
            .catch(console.error);
    });
});

server.listen(7000);

