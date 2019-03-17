import djs from 'discord.js'
import { Channels } from '../models/Channels'
import { Guilds } from '../models/Guilds'
import { config } from 'dotenv';
import { isContext } from 'vm';

const EmojisN = ['0⃣', '1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟']
const Emojis = {
    back: "🔙",
    end: "🔚",
    arrow_forward: "▶",
    arrow_backward: "◀",
    on: "🔘",
    off: "⚪",
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

export enum configFormType { main, channels, channel }

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

    constructor(msg: djs.Message) {
        let self = this;
        let authorId = msg.author.id;
        this.member = msg.guild.members.get(authorId);
        this.configChannelName = "fiston-config"
        this.guild = msg.guild;

        if ((!!this.member) && this.member.hasPermission('ADMINISTRATOR')) {
            try {
                this.fetchConfigChannel().then(channel => {
                    this.channel = channel
                    console.log('FCC ok...', channel.name);
                    msg.reply('Voyons cela dans mon duplex ' + channel);

                    this.fetchConfigMessage().then(post => {
                        this.post = post

                        console.log('FCM ok...', post.id)

                        this.conf = Promise.resolve({ post: post.id, chan: channel.id, form: configFormType.main });
                        this.createForm(configFormType.main)
                    })
                })
            } catch (e) { console.error(e) }
        } else {
            msg.reply('nop t pas admin fdp');
        }
    }

    async buildForm(type: configFormType, ops?: any): Promise<configForm> {
        let desc: string, allChannels: string[], state: IconfigState;
        let form: configForm;
        switch (type) {
            case configFormType.main:
                form = {
                    embed: new djs.RichEmbed()
                        .setTitle('`Le Fiston 🥃` *__Configuration__*')
                        .setDescription("__ __")
                        .setColor(16711680)
                        .addField("Channels :gear:", "Manage Channels")
                        .addField("Prefix :exclamation:", "Change guild prefix, current : !"),
                    emojis: [Emojis.end, Emojis.gear, Emojis.prefix]
                }
                return form;

            case configFormType.channels:
                const voiceChannels = this.guild.channels.filter((c: any) => c.type == 'voice')
                const gsetttings: any = await Guilds.getGuild({ id: this.guild.id });
                form = {
                    emojis: [Emojis.end, Emojis.back],
                    embed: new djs.RichEmbed()
                        .setTitle('`Le Fiston 🥃` *__Configuration__*')
                        .setColor(16711680)
                }
                allChannels = [];
                let i = 0
                desc = voiceChannels.reduce((D: string, c: any) => {
                    form.emojis.push(EmojisN[i])
                    allChannels.push(c.id)
                    D += `${EmojisN[i]} ${c.name} ${gsetttings.channels.includes(c.id) ? Emojis.on : Emojis.off}\n`;
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
                let { index } = ops;
                console.log('load form channnel ', index)
                state = await this.conf;
                console.log({ state })
                allChannels = state.data.allChannels
                let onWorkingChannel: string = allChannels[index];
                let onWorkingChannelName: any = this.guild.channels.get(onWorkingChannel).name
                this.conf = Promise.resolve({
                    post: state.post,
                    chan: state.chan,
                    form: configFormType.channel,
                    data: { allChannels, index, onWorkingChannel }
                })
                state = await this.conf;
                console.log({ state })
                let nextChannel = state.data.allChannels[index + 1];
                let prevChannel = state.data.allChannels[index - 1];
                let conf: any = await this.chanConf;
                if (!conf) {
                    Channels.addChannel({ id: onWorkingChannel, offline: onWorkingChannelName, guildId: this.guild.id })
                }
                conf = await this.chanConf;
                console.log({ conf })
                desc =
                    `__ Channel: ${onWorkingChannelName} __\n` +
                    `${Emojis.mega} to change the chatting ,ame, current \`${conf.names.chatting}\`\n` +
                    `${Emojis.mute} to change the offline name, current \`${conf.names.offline}\`\n` +
                    `${Emojis.mic} to change the chatting emoji, current ${conf.emojis.chatting}\n` +
                    `${Emojis.flag} to change the offline emoji, current ${conf.emojis.offline}\n` +
                    `${Emojis.joystick} to change the gaming emoji, current ${conf.emojis.gaming}\n`;

                if (this.guild.channels.get(prevChannel)) {
                    desc += `${Emojis.arrow_backward} to switch to the prev channel, \`${this.guild.channels.get(prevChannel).name}\`\n`;
                    form.emojis.push(Emojis.arrow_backward)
                };
                if (this.guild.channels.get(nextChannel)) {
                    desc += `${Emojis.arrow_forward} to switch to the next channel, \`${this.guild.channels.get(nextChannel).name}\`\n`;
                    form.emojis.push(Emojis.arrow_forward);
                };
                form = {
                    embed: new djs.RichEmbed()
                        .setTitle('`Le Fiston 🥃` *__Configuration__*')
                        .setDescription(desc)
                        .setColor(16711680),
                    emojis: [Emojis.end, Emojis.back]
                };
                [Emojis.mega, Emojis.mute, Emojis.mic, Emojis.flag, Emojis.joystick].forEach((e: string) => form.emojis.push(e))
                return form
        }
    }

    async createForm(type: configFormType, ops?: any): Promise<void> {
        try {
            let form = await this.buildForm(type, ops);
            let reacts = await this.sendForm(form);
            return this.reactHandler(reacts);
        } catch (e) {
            return e;
        }
    }

    async sendForm(form: configForm) {
        let { embed, emojis } = form;
        await this.post.clearReactions();
        await this.post.edit(`${this.member} !`, embed);
        for (let e of emojis) {
            await this.post.react(e);
        }
        return this.continueAwaitingReactions();
    }

    async continueAwaitingReactions() {
        return this.post.awaitReactions((r: any, u: any) => !!this.member && r.me && u.id == this.member.id, {
            max: 1
        });
    }

    async reactHandler(reacts: any) {

        const res = reacts.reduce((L: string, e: any) => {
            if (e.count == 2) L = e.emoji.name;
            return L;
        }, '')
        const state: IconfigState = await this.conf;
        if (EmojisN.includes(res)) {
            let index = EmojisN.indexOf(res);
            await this.createForm(configFormType.channel, { index });
        } else {
            console.log({ state });
            switch (res) {
                case Emojis.mega: /*  doStuff */; break;
                case Emojis.mute: /*  doStuff */; break;
                case Emojis.mic: /*  doStuff */; break;
                case Emojis.flag: /*  doStuff */; break;
                case Emojis.joystick: /*  doStuff */; break;
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
        configStatePromise.then(configState => {
            Guilds.updateGuild({ id: this.guild.id }, { configState });
        }).catch(console.error)
    }

    get chanConf() {
        return new Promise(async (resolve, reject) => {
            try {
                let state: any = await this.conf
                let id: any = state.data.onWorkingChannel;
                let chan: any = await Channels.getChannel({ id });
                resolve(chan);
            } catch (e) {
                reject(e)
            }
        });
    }

    set chanConf(conf) {
        this.conf.then((s: any) => {
            let id: any = s.chan;
            Channels.updateChannel({ id }, { conf });
        });
    }

    async fetchConfigMessage() {
        console.log('FCM...');
        let state: any = await this.conf;
        let msg: any;
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
        console.log('FCC...');
        let configChannel;
        try {
            configChannel = this.guild.channels.find((c: any) => c.name == this.configChannelName);
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