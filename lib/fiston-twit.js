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

        this.router.get('/save', (req, res) => {
            let { word, credit } = req.params;
            Words.addWord({ word, credit }, (err) => {
                res.send(err);
            });
        });

        this.router.get('/getWords', (req, res) => {
            Words.getWords((err, words) => {
                res.send(words);
            });
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


    tweet(status, callback) {
        this.twit.post('statuses/update', { status }, (err, data, response) => {
            console.log(`[${data.created_at}][${data.text}]`);
            if (err && typeof callback == 'function') callback(err);
            else callback(err, data, response)
        });
    }

    tweetWord(W, callback) {
        this.tweet(`Mot nul du jour :\n${W.word}\n\nProposé par : ${W.credit}`, (err, data, response) => {
            if (err && typeof callback == 'function') callback(err);
            this.retweetWord(W.word, (err, tweet, response) => {
                if (typeof callback == 'function') {
                    if (err) callback(err);
                    else callback(err, tweet, response);
                }
            });
        });
    }

    retweet(id, callback) {
        this.twit.post('statuses/retweet/:id', { id }, (err, data, response) => {
            if (typeof callback == 'function') {
                if (err) callback(err);
                else callback(err, data, response);
            }
        });
    }

    search(q, callback) {
        this.twit.get('search/tweets', { q, result_type: 'recent', count: '1' }, (err, data, respone) => {
            try {
                if (typeof callback == 'function') {
                    if (err) {
                        callback(err);
                    } else {
                        if (data.statuses[0]) {
                            let tweet = data.statuses[0],
                                { user, id_str } = tweet,
                                { screen_name, name } = user,
                                id = id_str;
                            console.log({ screen_name, name });
                            callback(err, { id, screen_name, name }, data, respone);
                        } else {
                            callback(err);
                        }
                    }
                }
            } catch (err) { console.error(err); }
        });
    }

    retweetWord(word, callback) {
        this.search(word, (err, data) => {
            if (err && typeof callback == 'function') callback(err);
            this.retweet(data.id, (err, tweet, response) => {
                if (typeof callback == 'function') {
                    if (err) callback(err);
                    else callback(err, tweet, response)
                }
            });
        });
    }

    tweetLastWord(callback) {
        Words.getLastWord((err, lastWord) => {
            if (err && typeof callback == 'function') callback(err);
            this.tweetWord(lastWord, err => {
                if (typeof callback == 'function') callback(err);
            });
        });
    }

    Tweet(callback) {
        this.tweetLastWord(err => {
            if (typeof callback == 'function') callback(err);
            Words.iterate(err => {
                if (typeof callback == 'function') callback(err);
            });
        });
    }
}


module.exports = Fiston;