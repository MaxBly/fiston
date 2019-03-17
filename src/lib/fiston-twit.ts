import express from 'express'
import Twit from 'twit'
import schedule from 'node-schedule'
import { Words } from '../models/Words'

export interface time { h: number, m: number }


export class TwitBot {
    twit: Twit;
    router: express.Router;
    job: schedule.Job;
    rule: schedule.RecurrenceRule;
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
        console.log('schedule', {
            year: n.getFullYear(),
            month: n.getMonth(),
            date: n.getDate(),
            day: n.getDay(),
            hours: n.getHours(),
            minutes: n.getMinutes(),
            seconds: n.getSeconds(),
        });

        let ruleDuCul = new schedule.RecurrenceRule();
        ruleDuCul.minute = 0;
        let jobDuCul = schedule.scheduleJob(ruleDuCul, this.duCul)

    }

    async duCul() {
        try {
            let res = await this.search('@BotDuCul, fiston');
            if ((res.screen_name == 'BotDuCul') && res.text.includes('fiston')) {
                return console.log(res);
            }
        } catch (e) { return e }
    }

    async tweet(status: any) {
        try {
            this.twit.post('statuses/update', { status }, (err: any, data: any, response: any) => {
                console.log(`[${data.created_at}][${data.text}]`);
                if (err) throw err;
                else return data
            });
        } catch (e) { return e }
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

    async search(q: string): Promise<any> {
        try {
            this.twit.get('search/tweets', { q, result_type: 'recent', count: 1 }, (err: any, data: any, respone: any) => {
                if (err) throw err;
                let tweet = data.statuses[0],
                    { user, id_str, text } = tweet,
                    { screen_name, name } = user,
                    id = id_str;
                console.log({ screen_name, name });
                return { id, screen_name, name, text };
            });
        } catch (e) { return e }
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