const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: String,
    name: String,
    guildId: String,
    activity: String,
    onChar: String,
    offChar: String
});


const channels = mongoose.model('Channels', channelSchema);

class Channels {

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

    static getChannels(ops) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options)
            let data = await channels.find(ops).exec()
            resolve(data)
        })
    }

    static getChannel(ops) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            let data = await channels.findOne(ops).exec()
            resolve(data)
        })
    }

    static addChannel(C) {
        return new Promise(async (resolve, reject) => {
            console.log(C)
            await mongoose.connect(this.url, this.options);
            let Channes = await channels.find({}).exec()
            let n = Channels.length + 1;
            console.log(n)
            C._id = mongoose.Types.ObjectId();
            let newChannel = new channels(C);
            await newChannel.save()
            resolve(newChannel);
        });
    }

    static updateChannel(ops, newOps) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            await channels.updateOne(ops, { $set: newOps }).exec()
            resolve();
        });
    }

    static removeChannel(ops) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            await channels.deleteOne(ops).exec()
            resolve();
        });
    }

}


module.exports = { Channels, channels };