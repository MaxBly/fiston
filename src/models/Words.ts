import mongoose from 'mongoose';
import S from 'string';
import { resolve } from 'path';
import { ReactionEmoji } from 'discord.js';
import { RecurrenceRule } from 'node-schedule';

const wordSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    word: String,
    index: Number,
    credit: String,
    isNext: Boolean
});

export interface IWordsOptions {
    _id?: mongoose.Types.ObjectId,
    word?: string,
    index?: number,
    credit?: string,
    isNext?: boolean,
}
export interface IWordsReduced {
    word: string,
    credit: string,
    isNext: boolean,
}
export const words = mongoose.model('Words', wordSchema);

export class Words {

    static get url(): string {
        return process.env.MONGO_URL
    }

    static get options(): mongoose.ConnectionOptions {
        return {
            useNewUrlParser: true,
            poolSize: 20,
            socketTimeoutMS: 480000,
            keepAlive: true,
            ssl: true,
            sslValidate: false
        }
    }

    static async getWords(ops?: IWordsOptions): Promise<IWordsOptions[]> {
        try {
            await mongoose.connect(this.url, this.options);
            return words.find(ops).exec()
        } catch (e) { return e }
    }

    static async getWord(ops?: IWordsOptions): Promise<IWordsOptions> {
        try {
            await mongoose.connect(this.url, this.options);
            return words.findOne(ops).exec()
        } catch (e) { return e }
    }

    static async getLastWord(): Promise<IWordsOptions> {
        try {
            await mongoose.connect(this.url, this.options);
            return words.findOne({ isNext: true }).exec()
        } catch (e) { return e }
    }

    static async getNextWord(): Promise<IWordsOptions> {
        try {
            await mongoose.connect(this.url, this.options);
            let last: IWordsOptions = await words.findOne({ isNext: true }).exec()
            let i = last.index + 1;
            return words.findOne({ index: i }).exec()
        } catch (e) { return e }
    }

    static async addWord(W: IWordsOptions) {
        try {
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
            return neW.save()
        } catch (e) { return e }
    }

    static async updateWord(ops: IWordsOptions, newOps: IWordsOptions) {
        try {
            await mongoose.connect(this.url, this.options);
            return words.updateOne(ops, { $set: newOps }).exec()
        } catch (e) { return e }
    }

    static async removeWord(ops: IWordsOptions) {
        try {
            await mongoose.connect(await this.url, this.options);
            return words.deleteOne(ops).exec()
        } catch (e) { return e }
    }

    static async reducer(): Promise<IWordsReduced[]> {
        try {
            let data: IWordsOptions[] = await this.getWords({})
            let reduced = data.reduce((W: IWordsReduced[], e: IWordsOptions) => {
                let { word, credit, isNext, index } = e;
                W[index - 1] = { word, credit, isNext };
                return W;
            }, []);
            return reduced;
        } catch (e) { return e }
    }

    static async iterate() {
        try {
            let next: IWordsOptions = await this.getNextWord()
            let index = next.index;
            await this.updateWord({ isNext: true }, { isNext: false })
            return this.updateWord({ index }, { isNext: true })
        } catch (e) { return e }
    }

    static async setNext(index: number) {
        try {
            await this.updateWord({ isNext: true }, { isNext: false })
            return this.updateWord({ index }, { isNext: true })
        } catch (e) { return e }
    }

    static async import(arr: any[]) {
        try {
            await mongoose.connect(this.url, this.options);
            let i = 0;
            for (let e of arr) {
                if (!i) return i++;
                i++;
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
            return;
        } catch (e) { return e }
    }
}
