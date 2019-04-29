import express from 'express'
import Twit from 'twit'
import schedule from 'node-schedule'
import { Words } from '../../models/Words'

export interface time { h: number, m: number }

export class TwitBot {
    twit: Twit;
    router: express.Router;
    job: schedule.Job;
    rule: schedule.RecurrenceRule;
    //jobDuCul: schedule.Job;
    constructor(tokens: any, time: time) {
        this.twit = new Twit({
            consumer_key: tokens.consumer.key,
            consumer_secret: tokens.consumer.secret,
            access_token: tokens.access.key,
            access_token_secret: tokens.access.secret,
            timeout_ms: 60 * 1000,
            strictSSL: true,
        });

        this.router = express.Router();
        this.router.use(express.static(__dirname + '/../../public'));

        this.router.get('/save', async (req, res) => {
            let { word, credit } = req.params;
            let data = await Words.addWord({ word, credit })
            res.send(data)
        });

        this.router.get('/getWords', async (req, res) => {
            let data = await Words.getWords({});
            res.send(data)
        });

        this.rule = new schedule.RecurrenceRule()
        this.rule.hour = time.h
        this.rule.minute = time.m
        this.job = schedule.scheduleJob(this.rule, this.Tweet)
        let n = this.job.nextInvocation();
        console.log('next tweet', {
            year: n.getFullYear(),
            month: n.getMonth(),
            date: n.getDate(),
            day: n.getDay(),
            hours: n.getHours(),
            minutes: n.getMinutes(),
            seconds: n.getSeconds(),
        });
        /* 
        let ruleDuCul = new schedule.RecurrenceRule();
        ruleDuCul.minute = 0;
        this.jobDuCul = schedule.scheduleJob(ruleDuCul, () => { this.duCul('fiston', 'BotDuCul') })
        */
    }

    /* 
    async duCul(word: string, author: string) {
        console.log('duCul...')
        try {
            let res: any = await this.search(`${word} from:${author}`);
            if ((res.screen_name === author) && (res.text.split(' ').includes(word))) {
                console.log('fiston found!')
                return this.reply(`🤔`, res.id, res.screen_name);
            } else {
                console.log('fiston not found, not this time, maybe later...')
            }
        } catch (e) { console.log(e) }
    }
    */

    async tweet(status: string) {
        return new Promise((resolve, reject) => {
            this.twit.post('statuses/update', { status }, (err: any, data: any, response: any) => {
                try {
                    console.log(`[${data.created_at}][${data.text}]`);
                    if (err) throw err;
                    else resolve(data)
                } catch (e) { reject(e) }
            });
        })
    }

    async reply(text: string, id: number | string, screen_name: string) {
        let status = `@${screen_name} ${text}`
        return new Promise((resolve, reject) => {
            this.twit.post('statuses/update', { status, in_reply_to_status_id: id }, (err: any, data: any, response: any) => {
                try {
                    console.log(`[${data.created_at}][${data.text}]`);
                    if (err) throw err;
                    else resolve(data)
                } catch (e) { reject(e) }
            });
        })
    }

    async tweetWord(W: any) {
        try {
            await this.tweet(`Mot nul du jour :\n${W.word}\n\nProposé par : ${W.credit}`)
            return this.retweetWord(W.word)
        } catch (e) { return e }
    }

    async retweet(id: any) {
        try {
            this.twit.post('statuses/retweet/:id', { id }, (err, data, response) => {
                if (err) throw err;
                else return data;
            });
        } catch (e) { return e }
    }

    async search(q: string) {
        return new Promise((resolve, reject) => {
            this.twit.get('search/tweets', { q, result_type: 'recent', count: 1 }, (err: any, data: any, respone: any) => {
                try {
                    if (err || !data.statuses[0].user) throw new Error('Tweet not found');
                    let tweet = data.statuses[0]
                    let { user, id_str, text } = tweet
                    let { screen_name, name } = user
                    let id = id_str
                    let res = { id, screen_name, name, text }
                    console.log('done');
                    resolve(res);
                } catch (e) { reject(e) }
            });
        })
    }

    async retweetWord(word: string) {
        try {
            let res: any = await this.search(word)
            return this.retweet(res.id)
        } catch (e) { return e }
    }

    async tweetLastWord() {
        try {
            let lastWord = await Words.getLastWord()
            return this.tweetWord(lastWord)
        } catch (e) { return e }
    }

    async Tweet() {
        try {
            await this.tweetLastWord()
            return Words.iterate()
        } catch (e) { return e }
    }
}