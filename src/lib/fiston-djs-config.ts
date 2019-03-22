import djs from 'discord.js'
import { Channels, IChannelsOptions } from '../models/Channels'
import { Guilds, IGuildOptions } from '../models/Guilds'
import { IncomingHttpHeaders } from 'http';
import { Collection } from 'mongoose';

const EmojisN = ['0⃣', '1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟']
const Emojis = {
    back: "🔙",
    end: "🔚",
    arrow_forward: "▶",
    arrow_backward: "◀",
    on: "✅",
    off: "❎",
    prefix: "❗",
    add: "➕",
    del: "➖",
    flag: "🏳",
    mic: "🎙",
    joystick: "🕹",
    mega: "📣",
    mute: "🔇",
    gear: "⚙"
}

export enum configFormType { main, channels, channel };
export type EmojisType = 'chatting' | 'gaming' | 'offline';
export type NamesType = 'chatting' | 'offline';

export interface IconfigState {
    post: string,
    chan: string,
    form?: configFormType,
    data?: any
}

export interface configForm {
    embed: djs.RichEmbed,
    emojis: string[]
}


export default class Config {
    member: djs.GuildMember | undefined;
    configChannelName: string;
    guild: djs.Guild;
    channel: djs.TextChannel | any;
    post: djs.Message | undefined;
    secondPost: djs.Message | undefined;

    constructor(msg: djs.Message) {
        let self = this;
        let authorId = msg.author.id;
        this.member = msg.guild.members.get(authorId);
        this.configChannelName = "fiston-config"
        this.guild = msg.guild;

        (async () => {
            if ((!!this.member) && this.member.hasPermission('ADMINISTRATOR')) {
                try {
                    this.channel = await this.fetchConfigChannel()
                    msg.reply('Voyons cela dans mon duplex ' + this.channel);
                    this.post = await this.fetchConfigMessage()
                    this.conf = Promise.resolve({ post: this.post.id, chan: this.channel.id, form: configFormType.main });
                    this.createForm(configFormType.main)
                } catch (e) { console.error(e) }
            } else {
                msg.reply('nop t pas admin fdp');
            }
        }).apply(this)
    }

    async buildForm(type: configFormType, ops?: any): Promise<configForm> {
        let desc: string, allChannels: string[], state: IconfigState;
        let form: configForm;
        const gsetttings: IGuildOptions = await Guilds.getGuild({ id: this.guild.id });
        switch (type) {
            case configFormType.main:
                form = {
                    embed: new djs.RichEmbed()
                        .setTitle('`Le Fiston 🥃` *__Configuration__*')
                        .setDescription("__ __")
                        .setColor(16711680)
                        .addField("Channels :gear:", "Manage Channels")
                        .addField("Prefix :exclamation:", "Change guild prefix, current : " + gsetttings.prefix),
                    emojis: [Emojis.end, Emojis.gear, Emojis.prefix]
                }
                return form;

            case configFormType.channels:
                const voiceChannels = this.guild.channels.filter((c: djs.GuildChannel) => c.type == 'voice')
                form = {
                    emojis: [Emojis.end, Emojis.back],
                    embed: new djs.RichEmbed()
                        .setTitle('`Le Fiston 🥃` *__Configuration__*')
                        .setColor(16711680)
                }
                allChannels = [];
                let i = 0
                desc = voiceChannels.reduce((D: string, c: djs.GuildChannel) => {
                    form.emojis.push(EmojisN[i])
                    allChannels.push(c.id)
                    D += `${EmojisN[i]} ${gsetttings.channels.includes(c.id) ? Emojis.on : Emojis.off} ${c.name}\n`;
                    i++;
                    return D;
                }, "__ Channels :gear: __\n");
                state = await this.conf;
                this.conf = Promise.resolve({
                    post: state.post,
                    chan: state.chan,
                    form: configFormType.channels,
                    data: { allChannels }
                });
                form.embed.setDescription(desc)
                return form

            case configFormType.channel:
                form = {
                    embed: new djs.RichEmbed()
                        .setTitle('`Le Fiston 🥃` *__Configuration__*')
                        .setColor(16711680),
                    emojis: [Emojis.end, Emojis.back]
                };

                let { index } = ops;
                console.log('load form channnel ', index)
                state = await this.conf;
                allChannels = state.data.allChannels
                let onWorkingChannel: string = allChannels[index];
                let onWorkingChannelName: string = this.guild.channels.get(onWorkingChannel).name
                this.conf = Promise.resolve({
                    post: state.post,
                    chan: state.chan,
                    form: configFormType.channel,
                    data: { allChannels, index, onWorkingChannel }
                })
                state = await this.conf;
                let nextChannel = state.data.allChannels[index + 1];
                let prevChannel = state.data.allChannels[index - 1];
                let conf: IChannelsOptions = await this.chanConf;
                if (!conf) {
                    Channels.addChannel({ id: onWorkingChannel, offline: onWorkingChannelName, guildId: this.guild.id })
                }
                conf = await this.chanConf;
                desc =
                    `__ Channel: ${onWorkingChannelName} __\n` +
                    `${Emojis.mega} to change the chatting name, current \`${conf.names.chatting}\`\n` +
                    `${Emojis.mute} to change the offline name, current \`${conf.names.offline}\`\n` +
                    `${Emojis.mic} to change the chatting emoji, current ${conf.emojis.chatting}\n` +
                    `${Emojis.flag} to change the offline emoji, current ${conf.emojis.offline}\n` +
                    `${Emojis.joystick} to change the gaming emoji, current ${conf.emojis.gaming}\n`;
                form.embed.setDescription(desc);
                if (this.guild.channels.get(prevChannel)) {
                    desc += `${Emojis.arrow_backward} to switch to the prev channel, \`${this.guild.channels.get(prevChannel).name}\`\n`;
                    form.emojis.push(Emojis.arrow_backward)
                };
                if (this.guild.channels.get(nextChannel)) {
                    desc += `${Emojis.arrow_forward} to switch to the next channel, \`${this.guild.channels.get(nextChannel).name}\`\n`;
                    form.emojis.push(Emojis.arrow_forward);
                };

                [Emojis.mega, Emojis.mute, Emojis.mic, Emojis.flag, Emojis.joystick].forEach((e: string) => form.emojis.push(e))
                return form
        }
    }

    async sendForm(form: configForm): Promise<djs.Collection<string, djs.Emoji | djs.MessageReaction>> {
        let { embed, emojis } = form;
        await this.post.clearReactions();
        await this.post.edit(`${this.member} !`, embed);
        for (let e of emojis) {
            await this.post.react(e);
        }
        return this.continueAwaitingReactions();
    }

    async createForm(type: configFormType, ops?: any) {
        try {
            console.log({ type })
            let form = await this.buildForm(type, ops);
            let reacts: djs.Collection<string, djs.Emoji | djs.MessageReaction> = await this.sendForm(form);
            return this.reactHandler(reacts);
        } catch (e) {
            return e;
        }
    }



    async continueAwaitingReactions(): Promise<djs.Collection<string, djs.Emoji | djs.MessageReaction>> {
        return this.post.awaitReactions((r: any, u: any) => !!this.member && r.me && u.id == this.member.id, {
            max: 1
        });
    }

    async awaitEmojis(msg?: string, done?: (emoji: string) => void) {
        let channel = await this.fetchConfigChannel();
        this.secondPost = (this.secondPost === undefined) ? await channel.send(msg) : await this.secondPost.edit(msg);
        let reacts = await this.secondPost.awaitReactions((r: any, u: djs.GuildMember) => !!this.member && u.id == this.member.id, {
            max: 1
        });
        let emoji = reacts.first().emoji;
        if ('requiresColons' in emoji) {
            this.awaitEmojis('❌ You must react with a __non custom__ emojis', done.bind(this))
        } else {
            this.secondPost.delete()
            done.bind(this)(emoji.name);
        }
    }

    async setEmoji(type: EmojisType) {
        this.awaitEmojis('💬 React this message with a __unicode__ emojis to modify the *' + type + '* emojis', async (emoji: string) => {
            let chanConfig: IChannelsOptions = await this.chanConf;
            chanConfig.emojis[type] = emoji;
            console.log({ chanConfig })
            this.chanConf = Promise.resolve(chanConfig);
        })
    }


    async awaitNames(msg?: string, done?: (name: string) => void) {
        let channel = await this.fetchConfigChannel();
        this.secondPost = (this.secondPost === undefined) ? await channel.send(msg) : await this.secondPost.edit(msg);
        let msgs = await channel.awaitMessages((m: djs.Message) => !!this.member && m.author.id == this.member.id, {
            max: 1
        });
        let reply = msgs.first();
        if (reply.content.length > 30) {
            this.awaitNames('❌ You must reply with a __30 characters less__ name', done.bind(this))
        } else {
            this.secondPost.delete();
            done.bind(this)(reply.content);
            reply.delete();
        }
    }

    async setName(type: NamesType) {
        this.awaitNames('💬 Reply to this message with the *' + type + '* name you want to set', async (name: string) => {
            let chanConfig: IChannelsOptions = await this.chanConf;
            chanConfig.names[type] = name;
            console.log({ chanConfig })
            this.chanConf = Promise.resolve(chanConfig);
        })
    }
    async setPrefix() {
        this.awaitNames('💬 Reply to this message with the *prefix* you want to set', async (name: string) => {
            let guild: IGuildOptions = await Guilds.getGuild({ id: this.guild.id });
            guild.prefix = name;
            console.log({ guild })
            Guilds.updateGuild({ id: this.guild.id }, guild);
        })
    }

    async reactHandler(reacts: djs.Collection<string, djs.Emoji | djs.MessageReaction>) {

        const res = reacts.reduce((L: string, e: any) => {
            if (e.count == 2) L = e.emoji.name;
            return L;
        }, '')
        const state: IconfigState = await this.conf;
        if (EmojisN.includes(res)) {
            let index = EmojisN.indexOf(res);
            await this.createForm(configFormType.channel, { index });
        } else {
            switch (res) {
                case Emojis.prefix: this.setPrefix(); break;
                case Emojis.mega: this.setName('chatting'); break;
                case Emojis.mute: this.setName('offline'); break;
                case Emojis.mic: this.setEmoji('chatting'); break;
                case Emojis.flag: this.setEmoji('offline'); break;
                case Emojis.joystick: this.setEmoji('gaming'); break;
                case Emojis.arrow_forward: this.createForm(configFormType.channel, { index: state.data.index + 1 }); break;
                case Emojis.arrow_backward: this.createForm(configFormType.channel, { index: state.data.index - 1 }); break;
                case Emojis.end: this.channel.delete(); break;
                case Emojis.gear: this.createForm(configFormType.channels); break;
                case Emojis.prefix: await this.channel.send(res); break;
                case Emojis.back:
                    if (state.form == configFormType.channels) this.createForm(configFormType.main);
                    else if (state.form == configFormType.channel) this.createForm(configFormType.channels);
                    break;
            }

        }
    }

    get conf(): Promise<IconfigState> {
        return new Promise<IconfigState>(async (resolve: any) => {
            let guild: any = await Guilds.getGuild({ id: this.guild.id });
            resolve(guild.configState)
        })

    }

    set conf(configStatePromise: Promise<IconfigState>) {
        (async () => {
            let configState = await configStatePromise;
            Guilds.updateGuild({ id: this.guild.id }, { configState });
        })();
    }

    get chanConf(): Promise<IChannelsOptions> {
        return new Promise<IChannelsOptions>(async (resolve, reject) => {
            try {
                let state: IconfigState = await this.conf
                let id: string = state.data.onWorkingChannel;
                let chan: IChannelsOptions = await Channels.getChannel({ id });
                resolve(chan);
            } catch (e) {
                reject(e)
            }
        });
    }

    set chanConf(chanConfig: Promise<IChannelsOptions>) {
        (async () => {
            let state = await this.conf;
            let conf = await chanConfig;
            let id = state.data.onWorkingChannel;
            console.log({ conf })
            Channels.updateChannel({ id }, conf);
        })();
    }

    async fetchConfigMessage() {
        let state: IconfigState = await this.conf;
        let msg: djs.Message | undefined | null;
        try {
            if (!!this.channel) msg = await this.channel.fetchMessage(state.post);
            if (!msg) throw new Error('no config message');
            else return msg;
        } catch (e) {
            if (!!this.channel) msg = await this.channel.send('`Loading...`');
            return msg;
        }
    }

    async fetchConfigChannel() {
        let configChannel: any;
        try {
            configChannel = this.guild.channels.find((c: any) => c.name == this.configChannelName && c.type == 'text');
            if (!configChannel) throw new Error('no config channel');
            else return configChannel;
        } catch (e) {
            let permission = djs.Permissions.resolve('VIEW_CHANNEL')
            let permissionOverwrites: djs.ChannelCreationOverwrites[] = [{ id: this.guild.id, denied: permission }];
            configChannel = await this.guild.createChannel(this.configChannelName, 'text', permissionOverwrites);
            return configChannel;
        }
    }

}