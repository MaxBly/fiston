const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: String,
    name: String,
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

    static getChannels(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            channels.find(ops).exec().then(data => {
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

    static getChannel(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            channels.findOne(ops).exec().then(data => {
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

    static addChannel(C, cb) {
        console.log(C)
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            channels.find({}).exec().then(Channels => {
                let n = Channels.length + 1;
                console.log(n)
                C._id = mongoose.Types.ObjectId();
                let newChannel = new channels(C);
                newChannel.save().then(_ => {
                    db.close();
                    cb(null, newChannel);
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

    static updateChannel(ops, newOps, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            channels.updateOne(ops, { $set: newOps }).exec().then(_ => {
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

    static removeChannel(ops, cb) {
        mongoose.connect(this.url, this.options);
        let db = mongoose.connection;
        db.once('open', _ => {
            channels.removeOne(ops).exec().then(_ => {
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


module.exports = { Channels, channels };