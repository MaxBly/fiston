const mongoose = require('mongoose');
const S = require('string');

const wordSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    word: String,
    index: Number,
    credit: String,
    isNext: Boolean
});


const words = mongoose.model('Words', wordSchema);

class Words {

    static get url() {
        return process.env.MONGO_URL
    }

    static get options() {
        return {
            useNewUrlParser: true,
            poolSize: 20,
            socketTimeoutMS: 480000,
            keepAlive: 300000,
            ssl: true,
            sslValidate: false
        }
    }

    static getWords(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            words.find(ops).exec().then(data => {
                db.close()
                cb(null, data)
            }).catch(err => {
                db.close()
                cb(err);
            });
        });
        db.on('error', err => {
            db.close()
            cb(err);
        });
    }

    static getWord(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            words.findOne(ops).exec().then(data => {
                db.close()
                cb(null, data)
            }).catch(err => {
                db.close()
                cb(err);
            });
        });
        db.on('error', err => {
            db.close()
            cb(err);
        });
    }

    static getLastWord(cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            words.findOne({ isNext: true }).exec().then(last => {
                db.close()
                cb(null, last)
            }).catch(err => {
                db.close()
                cb(err);
            });
        });
        db.on('error', err => {
            db.close()
            cb(err);
        });
    }

    static getNextWord(cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            words.findOne({ isNext: true }).exec().then(last => {
                let i = last.index + 1;
                words.findOne({ index: i }).exec().then(next => {
                    db.close()
                    cb(null, next)
                }).catch(err => {
                    db.close()
                    cb(err);
                });
            }).catch(err => {
                db.close()
                cb(err);
            });

        });
        db.on('error', err => {
            db.close()
            cb(err);
        });
    }

    static addWord(W, cb) {
        console.log(W)
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            words.find({}).exec().then(Words => {
                let n = Words.length + 1;
                console.log(n)
                let neW = new words({
                    _id: new mongoose.Types.ObjectId(),
                    index: n,
                    word: W.word,
                    credit: W.credit,
                    isNext: false
                });
                neW.save().then(_ => {
                    db.close();
                    cb(null, neW);
                }).catch(err => {
                    db.close();
                    cb(err)
                });
            }).catch(err => {
                db.close();
                cb(err)
            });
        });
        db.on('error', err => {
            db.close();
            cb(err);
        });
    }

    static updateWord(ops, newOps, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            words.updateOne(ops, { $set: newOps }).exec().then(_ => {
                db.close();
                cb(null, _);
            }).catch(err => {
                db.close();
                cb(err);
            });
        });
        db.on('error', err => {
            db.close()
            cb(err);
        });
    }

    static removeWord(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            words.removeOne(ops).exec().then(_ => {
                db.close();
                cb(null, _);
            }).catch(err => {
                db.close();
                cb(err);
            });
        });
        db.on('error', err => {
            db.close()
            cb(err);
        });
    }

    static reducer(cb) {
        this.getWords({}, (err, data) => {
            if (err) cb(err);
            let reduced = data.reduce((W, e) => {
                let { word, credit, isNext, index } = e;
                W[index - 1] = { word, credit, isNext };
                return W;
            }, []);
            cb(null, reduced);
        });
    }

    static iterate(cb) {
        this.getNextWord((err, next) => {
            let i = next.index;
            console.log(i)
            this.updateWord({ isNext: true }, { isNext: false }, (err, _) => {
                if (err) cb(err, _);
                this.updateWord({ index: i }, { isNext: true }, (err, _) => {
                    cb(err, _)
                });
            });
        });
    }

    static import(arr) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            arr.forEach((e, i) => {
                if (!i) return;
                //let w = S(e[0]).latinise().stripPunctuation().strip('Le ', 'le ', 'La ', 'la ', 'Un ', 'un ', 'Une ', 'une ').s.toLowerCase();
                let obj = new words({
                    _id: new mongoose.Types.ObjectId(),
                    word: e[0],
                    index: i,
                    isNext: (i == arr[0]),
                    credit: e[1]
                });
                obj.save()
                    .then(console.log)
                    .catch(console.error)
            });
        });
        db.on('error', err => {
            db.close()
            cb(err);
        });
    }
}


module.exports = { Words, words };