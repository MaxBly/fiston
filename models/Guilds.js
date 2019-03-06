const mongoose = require('mongoose');
const { Channels, channels } = require('./Channels');

const guildSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: String,
    prefix: String,
    channels: [String],
    schedule: Boolean,
    configState: {
        msgId: String,
        userId: String,
        isClose: Boolean,
        form: String,
        data: Object
    },
});


const guilds = mongoose.model('Guilds', guildSchema);

class Guilds {

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

    static getGuilds(ops) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            let data = await guilds.find(ops).exec();
            resolve(data)
        });
    }

    static getGuild(ops) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            let data = await guilds.findOne(ops).exec()
            resolve(data)
        })
    }

    static getGuildChannels(ops) {
        return new Promise(async (resolve, reject) => {
            try {
                let guild = await this.getGuild(ops)
                for await (let id of guild.channels) {
                    let channel = await Channels.getChannel({ id })
                    resolve(channel)
                }
            } catch (e) {
                reject(e)
            }
        });
    }

    static createGuild(guildId) {
        return {
            id: guildId,
            prefix: '!',
            channels: [],
            schedule: false,
            configState: {
                channelId: '',
                msgId: '',
                userIds: [],
                isClose: true,
                form: '',
                data: {}
            },
        }
    }

    static addGuild(guildId) {
        let G = this.createGuild(guildId);
        return new Promise(async (resolve, reject) => {
            console.log(G)
            await mongoose.connect(this.url, this.options);
            let Guilds = await guilds.find({}).exec()
            let n = Guilds.length + 1;
            console.log(n)
            G._id = new mongoose.Types.ObjectId();
            let newGuild = new guilds(G);
            await newGuild.save()
            resolve(newGuild);
        });
    }

    static updateGuild(ops, newOps) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            await guilds.updateOne(ops, { $set: newOps }).exec()
            resolve();
        })
    }

    static removeGuild(ops) {
        return new Promise(async (resolve, reject) => {
            await mongoose.connect(this.url, this.options);
            await guilds.deleteOne(ops).exec()
            resolve();
        })
    }

}


module.exports = { Guilds, guilds };