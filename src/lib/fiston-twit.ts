import express from 'express'
import Twit from 'twit'
import schedule from 'node-schedule'
import { Words } from '../models/Words'

export default class Fiston {
    twit: Twit;
    router: express.Router;
    job: any;
    constructor(tokens: any) {
        this.twit = new Twit({
            consumer_key: tokens.consumer.key,
            consumer_secret: tokens.consumer.secret,
            access_token: tokens.access.key,
            access_token_secret: tokens.access.secret,
            timeout_ms: 60 * 1000,
            strictSSL: true,
        });

        this.router = express.Router();
        this.router.use(express.static(__dirname + '/../public'));

        this.router.get('/save', async (req, res) => {
            let { word, credit } = req.params;
            let data = await Words.addWord({ word, credit })
            res.send(data)
        });

        this.router.get('/getWords', async (req, res) => {
            let data = await Words.getWords({});
            res.send(data)
        });
    }

    schedule(time: { h: number, m: number }) {
        this.job = schedule.scheduleJob(`${time.m} ${time.h} * * *`, this.Tweet);
        let n = this.job.nextInvocation();
        console.log('schedule', {
            year: n.getFullYear(),
            month: n.getMonth(),
            date: n.getDate(),
            day: n.getDay(),
            hours: n.getHours(),
            minutes: n.getMinutes(),
            seconds: n.getSeconds(),
        });

    }


    tweet(status: any) {
        return new Promise((resolve: any, reject: any) => {
            this.twit.post('statuses/update', { status }, (err: any, data: any, response: any) => {
                console.log(`[${data.created_at}][${data.text}]`);
                if (err) reject(err);
                else resolve(data, response)
            });
        });
    }

    tweetWord(W: any) {
        return new Promise(async (resolve: any) => {
            await this.tweet(`Mot nul du jour :\n${W.word}\n\nProposé par : ${W.credit}`)
            await this.retweetWord(W.word)
            resolve()
        })
    }

    retweet(id: any) {
        return new Promise((resolve: any, reject: any) => {
            this.twit.post('statuses/retweet/:id', { id }, (err, data, response) => {
                if (err) reject(err);
                else resolve(data, response);
            });
        });
    }

    search(q: any) {
        return new Promise((resolve: any, reject: any) => {
            this.twit.get('search/tweets', { q, result_type: 'recent', count: 1 }, (err: any, data: any, respone: any) => {
                if (err) reject(err);
                try {
                    let tweet = data.statuses[0],
                        { user, id_str } = tweet,
                        { screen_name, name } = user,
                        id = id_str;
                    console.log({ screen_name, name });
                    resolve({ id, screen_name, name }, data, respone);
                } catch (e) { reject(e) }
            });
        });
    }

    retweetWord(word: any) {
        return new Promise(async (resolve: any, reject: any) => {
            let data: any = await this.search(word)
            await this.retweet(data.id)
            resolve()
        });
    }

    tweetLastWord() {
        return new Promise(async (resolve: any, reject: any) => {
            let lastWord = await Words.getLastWord()
            await this.tweetWord(lastWord)
            resolve()
        });
    }

    Tweet() {
        return new Promise(async (resolve: any, reject: any) => {
            await this.tweetLastWord()
            await Words.iterate()
            resolve()
        });
    }
}