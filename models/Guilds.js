const mongoose = require('mongoose');
const { Channels, channels } = require('./Channels');

const guildSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: String,
    prefix: String,
    channels: [mongoose.Schema.Types.ObjectId],
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

    static getGuilds(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            guilds.find(ops).exec().then(data => {
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

    static getGuild(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            guilds.findOne(ops).exec().then(data => {
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

    static getGuildChannels(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            guilds.findOne(ops).exec().then(data => {
                let chans = data.channels.reduce((C, c) => {
                    channels.findOne({ _id: c }).exec().then(data => {
                        C.push({ data });
                    }).catch(err => {
                        db.close();
                        cb(err);
                    });
                    return C;
                }, []);
                db.close();
                cb(null, chans);
            }).catch(err => {
                db.close();
                cb(err);
            });
        });
        db.on('error', err => {
            db.close();
            cb(err);
        });
    }

    static addGuild(G, cb) {
        console.log(G)
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            guilds.find({}).exec().then(Guilds => {
                let n = Guilds.length + 1;
                console.log(n)
                G._id = new mongoose.Types.ObjectId();
                let newGuild = new guilds(G);
                newGuild.save().then(_ => {
                    db.close();
                    cb(null, newGuild);
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

    static updateGuild(ops, newOps, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            guilds.updateOne(ops, { $set: newOps }).exec().then(_ => {
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

    static removeGuild(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            guilds.removeOne(ops).exec().then(_ => {
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

}


module.exports = { Guilds, guilds };