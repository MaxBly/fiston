var express = require('express');
var fs = require('fs');
var Twit = require('twit');
var schedule = require('node-schedule');

function Fiston(tokens) {

    var self = this;

    if (tokens) {
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
            var { w, c } = req.params;
            self.addWord(w, c, (err) => {
                res.send(err);
            });
        });
    }


    this.schedule = ({ h, m }) => {
        if (!tokens) return;
        this.job = schedule.scheduleJob(`${m} ${h} * * *`, this.Tweet);
        with (this.job.nextInvocation()) {
            console.log({
                year: getFullYear(),
                month: getMonth(),
                date: getDate(),
                day: getDay(),
                hours: getHours(),
                minutes: getMinutes(),
                seconds: getSeconds(),
            });
        }
    }

    this.getWords = (callback) => {
        fs.readFile(__dirname + '/../json/words.json', (err, data) => {
            if (err) throw err;
            var words = JSON.parse(data)
            if (typeof callback == 'function') {
                if (err) callback(err);
                else callback(err, words);
            }
        });
    }

    this.getWordCounter = (callback) => {
        self.getWords((err, words) => {
            var counter = words[0];
            if (typeof callback == 'function') {
                if (err) callback(err);
                else callback(err, counter);
            }
        });
    }

    this.getLastWord = (callback) => {
        self.getWords((err, words) => {
            if (typeof callback == 'function') if (err) callback(err);
            self.getWordCounter((err, counter) => {
                if (typeof callback == 'function') {
                    if (err) callback(err);
                    else callback(err, words[counter]);
                }
            });
        });
    }

    this.saveWords = (words, callback) => {
        console.log({ counter: words[0] });
        fs.writeFile(__dirname + '/../json/words.json', JSON.stringify(words, null, "\t"), err => {
            if (typeof callback == 'function') callback(err);
        });
    }

    this.addWord = (w, c, callback) => {
        self.getWords((err, words) => {
            words.push([w, c]);
            self.saveWords(words, err => {
                if (typeof callback == 'function') callback(err);
            });
        });
    }

    this.addWordCounter = (callback) => {
        self.getWords((err, words) => {
            if (err && typeof callback == 'function') callback(err);
            console.log({ counter: words[0] });
            words[0]++;
            self.saveWords(words, err => {
                if (typeof callback == 'function') callback(err);
            });
        });
    }

    this.tweet = (status, callback) => {
        if (!tokens) return;
        self.twit.post('statuses/update', { status }, (err, data, response) => {
            console.log(`[${data.created_at}][${data.text}]`);
            if (err && typeof callback == 'function') callback(err);
            else callback(err, data, response)

        });
    }

    this.tweetWord = (word, callback) => {
        if (!tokens) return;
        self.tweet(`Mot nul du jour :\n${word[0]}\n\nProposé par : ${word[1]}`, (err, data, response) => {
            try {
                if (err && typeof callback == 'function') callback(err);
                self.retweetWord(word[0], (err, tweet, response) => {
                    if (typeof callback == 'function') {
                        if (err) callback(err);
                        else callback(err, tweet, response);
                    }
                });
            } catch (err) { console.error(err); }
        });
    }

    this.retweet = (id, callback) => {
        if (!tokens) return;
        self.twit.post('statuses/retweet/:id', { id }, (err, data, response) => {
            if (typeof callback == 'function') {
                if (err) callback(err);
                else callback(err, data, response);
            }
        });
    }

    this.search = (q, callback) => {
        if (!tokens) return;
        self.twit.get('search/tweets', { q, result_type: 'recent', count: '1' }, (err, data, respone) => {
            if (typeof callback == 'function') {
                if (err) {
                    callback(err);
                } else {
                    if (data.statuses[0]) {
                        var tweet = data.statuses[0],
                            { user, id_str } = tweet,
                            { screen_name, name } = user,
                            id = id_str;
                        callback(err, { id, screen_name, name }, data, respone);
                    } else {
                        callback(err);
                    }
                }
            }
        });
    }

    this.retweetWord = (word, callback) => {
        if (!tokens) return;
        self.search(word, (err, data) => {
            if (err && typeof callback == 'function') callback(err);
            console.log(data);
            self.retweet(data.id, (err, tweet, response) => {
                if (typeof callback == 'function') {
                    if (err) callback(err);
                    else callback(err, tweet, response)
                }
                console.log(tweet.text)
            });
        });
    }

    this.tweetLastWord = (callback) => {
        if (!tokens) return;
        self.getLastWord((err, lastWord) => {
            console.log({ lastWord })
            if (err && typeof callback == 'function') callback(err);
            self.tweetWord(lastWord, err => {
                console.log('cb')
                if (typeof callback == 'function') callback(err);
            });
        });
    }

    this.Tweet = (callback) => {
        if (!tokens) return;
        self.tweetLastWord(err => {
            if (typeof callback == 'function') callback(err);
            self.addWordCounter(err => {
                if (typeof callback == 'function') callback(err);
            });
        });
    }
}



module.exports = Fiston;