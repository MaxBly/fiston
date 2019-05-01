//require
import https from "https";
import express from "express";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import socket from "socket.io";
dotenv.config();

//server
const httpsOptions: https.ServerOptions = {
    cert: fs.readFileSync('/etc/letsencrypt/live/bly-net.com/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/bly-net.com/privkey.pem'),
}
const app = express();
const server = https.createServer(httpsOptions, app);
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

    socket.on('getWords', async () => {
        try {
            let words = await Words.getWords({})
            socket.emit('loadWords', words)
        } catch (e) {
            console.error(e);
        }
    });

    socket.on('getReducedWords', async () => {
        try {
            let words = await Words.reducer()
            socket.emit('loadReducedWords', words)
        } catch (e) {
            console.error(e);
        }
    });

    socket.on('save', async (W: any) => {
        try {
            let neW = await Words.addWord(W)
            console.log(neW);
            socket.emit('saveOk')
        } catch (e) {
            console.error(e);

        }
    });

    socket.on('remove', async (i: number) => {
        try {        
            await Words.removeWord({ index: i })
            socket.emit('removeOk')
        } catch (e) {
            console.error(e);
        }
    });
});

server.listen(7000);

