import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: String,
    guildId: String,
    names: {
        offline: String,
        chatting: String,
    },
    emojis: {
        offline: String,
        chatting: String,
        gaming: String,
    },
});
export const channels = mongoose.model('Channels', channelSchema);

export interface IChannelsOptions {
    _id?: mongoose.Types.ObjectId,
    id?: string,
    guildId?: string,
    names?: {
        offline?: string,
        chatting?: string,
    },
    emojis?: {
        offline?: string,
        chatting?: string,
        gaming?: string,
    }
}

export class Channels {

    static get url(): string {
        return process.env.MONGO_URL
    }

    static get options(): mongoose.ConnectionOpenOptions {
        return {
            useNewUrlParser: true,
            poolSize: 20,
            socketTimeoutMS: 480000,
            keepAlive: true,
            ssl: true,
            sslValidate: false
        }
    }

    static async getChannels(ops?: IChannelsOptions): Promise<IChannelsOptions[]> {
        try {
            await mongoose.connect(this.url, this.options)
            return channels.find(ops).exec()
        } catch (e) { return e }
    }

    static async getChannel(ops?: IChannelsOptions): Promise<IChannelsOptions> {
        try {
            await mongoose.connect(this.url, this.options);
            return channels.findOne(ops).exec()
        } catch (e) { return e }
    }

    static async addChannel(channel: { id: string, offline: string, guildId: string }) {
        try {
            let ops: IChannelsOptions = this.createChannel(channel);
            await mongoose.connect(this.url, this.options);
            let newChannel = new channels(ops);
            return newChannel.save();
        } catch (e) { return e }
    }

    static createChannel({ id, offline, guildId }: { id: string, offline: string, guildId: string }): IChannelsOptions {
        return {
            _id: new mongoose.Types.ObjectId(),
            id,
            guildId,
            names: {
                offline,
                chatting: 'Just Chatting',
            },
            emojis: {
                offline: "🏳",
                chatting: "🎙",
                gaming: "🕹",
            },
        }
    }

    static async updateChannel(ops: IChannelsOptions, newOps: IChannelsOptions) {
        try {
            await mongoose.connect(this.url, this.options);
            return channels.updateOne(ops, { $set: newOps }).exec()
        } catch (e) { return e }
    }

    static async removeChannel(ops: IChannelsOptions) {
        try {
            await mongoose.connect(this.url, this.options);
            return channels.deleteOne(ops).exec()
        } catch (e) { return e }
    }
}