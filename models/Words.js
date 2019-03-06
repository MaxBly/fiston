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

    static getWords(ops) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            let data = await words.find(ops).exec()
            resolve(data)
        })
    }

    static getWord(ops) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            let data = await words.findOne(ops).exec()
            resolve(data)
        });
    }

    static getLastWord() {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            let last = await words.findOne({ isNext: true }).exec()
            resolve(last)
        });
    }

    static getNextWord() {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            let last = await words.findOne({ isNext: true }).exec()
            let i = last.index + 1;
            let next = await words.findOne({ index: i }).exec()
            resolve(next)
        });
    }

    static addWord(W) {
        return new Promise(async (resolve, reject) => {
            console.log(W)
            await mongoose.connect(this.url, this.options);
            let Words = await words.find({}).exec()
            let n = Words.length + 1;
            console.log(n)
            let neW = new words({
                _id: new mongoose.Types.ObjectId(),
                index: n,
                word: W.word,
                credit: W.credit,
                isNext: false
            });
            await neW.save()
            resolve(neW);
        });
    }

    static updateWord(ops, newOps) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            await words.updateOne(ops, { $set: newOps }).exec()
            resolve();
        });
    }

    static removeWord(ops) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            await words.deleteOne(ops).exec()
            resolve();
        });
    }

    static reducer() {
        return new Promise(async (resolve, reject) => {
            let data = await this.getWords({})
            let reduced = data.reduce((W, e) => {
                let { word, credit, isNext, index } = e;
                W[index - 1] = { word, credit, isNext };
                return W;
            }, []);
            resolve(reduced);
        });
    }

    static iterate() {
        return new Promise(async (resolve, reject) => {
            let next = await this.getNextWord()
            let i = next.index;
            console.log(i)
            await this.updateWord({ isNext: true }, { isNext: false })
            await this.updateWord({ index: i }, { isNext: true })
            resolve()
        });
    }

    static async import(arr) {
        await mongoose.connect(this.url, this.options);
        for await (let e of arr) {
            if (!i) return;
            //let w = S(e[0]).latinise().stripPunctuation().strip('Le ', 'le ', 'La ', 'la ', 'Un ', 'un ', 'Une ', 'une ').s.toLowerCase();
            let obj = new words({
                _id: new mongoose.Types.ObjectId(),
                word: e[0],
                index: i,
                isNext: (i == arr[0]),
                credit: e[1]
            });
            await obj.save()
        };
    }
}


module.exports = { Words, words };