//require
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import socket from "socket.io";
dotenv.config();

//server

const app = express();
const server = http.createServer(app);
let sio = socket.listen(server);

//libs
import { Words } from "./models/Words"
import { TwitBot as FistonTwit, time } from "./lib/twitbot/Twitbot"
//init
const time: time = { h: 7, m: 30 };
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

