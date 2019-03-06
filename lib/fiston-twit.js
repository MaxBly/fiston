const express = require('express');
const Twit = require('twit');
const schedule = require('node-schedule');
const { Words } = require('../models/Words')

class Fiston {
    constructor(tokens) {
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
            let data = await Words.getWords();
            res.send(data)
        });
    }

    schedule({ h, m }) {
        this.job = schedule.scheduleJob(`${m} ${h} * * *`, this.Tweet);
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


    tweet(status) {
        return new Promise((resolve, reject) => {
            this.twit.post('statuses/update', { status }, (err, data, response) => {
                console.log(`[${data.created_at}][${data.text}]`);
                if (err) reject(err);
                else resolve(data, response)
            });
        });
    }

    tweetWord(W) {
        return new Promise(async (resolve, reject) => {
            await this.tweet(`Mot nul du jour :\n${W.word}\n\nProposé par : ${W.credit}`)
            await this.retweetWord(W.word)
            resolve()
        })
    }

    retweet(id) {
        return new Promise((resolve, reject) => {
            this.twit.post('statuses/retweet/:id', { id }, (err, data, response) => {
                if (err) reject(err);
                else resolve(data, response);
            });
        });
    }

    search(q) {
        return new Promise((resolve, reject) => {
            this.twit.get('search/tweets', { q, result_type: 'recent', count: '1' }, (err, data, respone) => {
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

    retweetWord(word) {
        return new Promise(async (resolve, reject) => {
            let data = await this.search(word)
            await this.retweet(data.id)
            resolve()
        });
    }

    tweetLastWord() {
        return new Promise(async (resolve, reject) => {
            let lastWord = await Words.getLastWord()
            await this.tweetWord(lastWord)
            resolve()
        });
    }

    Tweet() {
        return new Promise(async (resolve, reject) => {
            await this.tweetLastWord()
            await Words.iterate()
            resolve()
        });
    }
}


module.exports = Fiston;