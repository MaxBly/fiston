import mongoose from 'mongoose'
import { Channels, channels, IChannelsOptions } from './Channels'
import { ObjectId } from 'bson';


const guildSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: String,
    prefix: String,
    channels: [String],
    schedule: Boolean,
    configState: Object,
});
export const guilds = mongoose.model('Guilds', guildSchema);

export interface IGuildOptions {
    _id?: mongoose.Types.ObjectId,
    id?: string,
    prefix?: string,
    channels?: string[],
    schedule?: boolean,
    configState?: any
}

export class Guilds {

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

    static async getGuilds(ops?: IGuildOptions): Promise<IGuildOptions[]> {
        try {
            await mongoose.connect(this.url, this.options);
            return guilds.find(ops).exec();
        } catch (e) { return e }
    }

    static async getGuild(ops?: IGuildOptions): Promise<IGuildOptions> {
        try {
            await mongoose.connect(this.url, this.options);
            return guilds.findOne(ops).exec()
        } catch (e) { return e }
    }

    static async * getGuildChannels(ops: IGuildOptions): AsyncIterableIterator<IChannelsOptions> {
        try {
            let guild: IGuildOptions = await this.getGuild(ops)
            for (let id of guild.channels) {
                yield Channels.getChannel({ id })
            }
        } catch (e) { return e }
    }

    static createGuild(id: string): IGuildOptions {
        return {
            id,
            prefix: '!',
            channels: [],
            schedule: false,
            configState: {},
            _id: new mongoose.Types.ObjectId()
        }
    }

    static async addGuild(guildId: string) {
        try {
            let G = this.createGuild(guildId);
            console.log(G)
            await mongoose.connect(this.url, this.options);
            let newGuild = new guilds(G);
            return newGuild.save();
        } catch (e) { return e }
    }

    static async updateGuild(ops: IGuildOptions, newOps: IGuildOptions) {
        try {
            await mongoose.connect(this.url, this.options);
            return guilds.updateOne(ops, { $set: newOps }).exec()
        } catch (e) { return e }
    }

    static async removeGuild(ops: IGuildOptions) {
        try {
            await mongoose.connect(this.url, this.options);
            return guilds.deleteOne(ops).exec()
        } catch (e) { return e }
    }
}

