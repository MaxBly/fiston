import djs from 'discord.js'
import { Channels, IChannelsOptions } from '../../models/Channels'
import { Guilds, IGuildOptions } from '../../models/Guilds'
import form, { Post, StateProvider } from 'djs-forms'

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

export interface Posts {
    main?: Post,
    channel?: Post,
    channels?: Post
}

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
export interface formOptions {
    index?: number,
    keepEmojis?: boolean
}

export default class Config {
    member: djs.GuildMember | undefined;
    configChannelName: string;
    guild: djs.Guild;
    channel: djs.TextChannel | any;

    secondPost: any;
    form: form
    posts: Posts = {};
    constructor(msg: djs.Message, public reloadsChannels: () => void) {
        let authorId = msg.author.id;
        this.member = msg.guild.members.get(authorId);
        this.configChannelName = "fiston-config"
        this.guild = msg.guild;

        (async () => {
            if ((!!this.member) && this.member.hasPermission('ADMINISTRATOR')) {
                try {
                    let gset = await Guilds.getGuild({ id: this.guild.id })
                    if (!gset) await Guilds.addGuild(this.guild.id)
                    this.form = form.create(msg.client, this.guild, 'fiston-channel', [{ id: this.guild.id, denied: djs.Permissions.resolve('VIEW_CHANNEL') }])
                    msg.delete();

                    this.form.createPost('main')
                        .setPost(async () => {
                            const gsetttings: IGuildOptions = await Guilds.getGuild({ id: this.guild.id });
                            return {
                                embed: new djs.RichEmbed()
                                    .setTitle('`Le Fiston 🥃` *__Configuration__*')
                                    .setDescription("__ __")
                                    .setColor(16711680)
                                    .addField("Channels :gear:", "Manage Channels")
                                    .addField("Prefix :exclamation:", "Change guild prefix, current : " + gsetttings.prefix),
                                content: this.member + ' !'
                            }
                        })
                        .setReacts([Emojis.end, Emojis.gear, Emojis.prefix],
                            (react: djs.MessageReaction) => {
                                switch (react.emoji.name) {
                                    case Emojis.end: this.form.close(true); break;
                                    case Emojis.gear: this.form.posts.get('channels').display(); break;
                                    case Emojis.prefix: this.setPrefix(); break;
                                }
                            })

                    this.form.createPost('channels')
                        .setBuilder(async (ops: any) => {
                            const gsetttings: IGuildOptions = await Guilds.getGuild({ id: this.guild.id });
                            const voiceChannels = this.guild.channels.filter((c: djs.GuildChannel) => c.type == 'voice')
                            let reacts = [Emojis.end, Emojis.back]
                            let post = {
                                embed: new djs.RichEmbed()
                                    .setTitle('`Le Fiston 🥃` *__Configuration__*')
                                    .setColor(16711680),
                                content: this.member + ' !'
                            }
                            let i = 0;
                            let allChannels = [];
                            let desc = voiceChannels.reduce((D: string, c: djs.GuildChannel) => {
                                reacts.push(EmojisN[i])
                                allChannels.push(c.id)
                                D += `${EmojisN[i]} ${gsetttings.channels.includes(c.id) ? Emojis.on : Emojis.off} ${c.name}\n`;
                                i++;
                                return D;
                            }, "__ Channels :gear: __\n");
                            ops.setStateData({ allChannels })
                            post.embed.setDescription(desc)
                            return { post, reacts }
                        }, (react: djs.MessageReaction) => {
                            if (EmojisN.includes(react.emoji.name)) {
                                let index = EmojisN.indexOf(react.emoji.name);
                                this.form.posts.get('channel').display({ index });
                            } else {
                                switch (react.emoji.name) {
                                    case Emojis.back: this.form.posts.get('main').display({ guildId: this.guild.id }); break;
                                    case Emojis.end: this.form.close(true); break;
                                }
                            }
                        })

                    this.form.createPost('channel')
                        .setBuilder(async (ops: any) => {
                            //ops.index
                            const gsetttings: IGuildOptions = await Guilds.getGuild({ id: this.guild.id });
                            let post = {
                                embed: new djs.RichEmbed()
                                    .setTitle('`Le Fiston 🥃` *__Configuration__*')
                                    .setColor(16711680),
                                content: this.member + ' !'
                            }
                            let reacts = [Emojis.end, Emojis.back];
                            let { index } = ops;
                            let { allChannels } = ops.state.data;
                            let onWorkingChannel: string = allChannels[index];
                            let onWorkingChannelName: string = this.guild.channels.get(onWorkingChannel).name;
                            ops.setStateData({ allChannels, onWorkingChannel, index })
                            let nextChannel = ops.state.data.allChannels[index + 1];
                            let prevChannel = ops.state.data.allChannels[index - 1];
                            let isEnabled = gsetttings.channels.includes(onWorkingChannel);

                            let conf: IChannelsOptions = await this.chanConf;
                            if (!conf) Channels.addChannel({ id: onWorkingChannel, offline: onWorkingChannelName, guildId: ops.guild.id })
                            conf = await this.chanConf;
                            let desc = `__ Channel: ${onWorkingChannelName} __\n`;
                            if (isEnabled) {
                                desc +=
                                    `${Emojis.mega} to change the chatting name, current \`${conf.names.chatting}\`\n` +
                                    `${Emojis.mute} to change the offline name, current \`${conf.names.offline}\`\n` +
                                    `${Emojis.mic} to change the chatting emoji, current ${conf.emojis.chatting}\n` +
                                    `${Emojis.flag} to change the offline emoji, current ${conf.emojis.offline}\n` +
                                    `${Emojis.joystick} to change the gaming emoji, current ${conf.emojis.gaming}\n` +
                                    `${Emojis.del} to disable this channel\n`;
                            } else {
                                desc += `${Emojis.add} to enable this channel\n`;
                            }

                            if (this.guild.channels.get(prevChannel)) {
                                desc += `${Emojis.arrow_backward} to switch to the prev channel, \`${this.guild.channels.get(prevChannel).name}\`\n`;
                                reacts.push(Emojis.arrow_backward)
                            };
                            if (this.guild.channels.get(nextChannel)) {
                                desc += `${Emojis.arrow_forward} to switch to the next channel, \`${this.guild.channels.get(nextChannel).name}\`\n`;
                                reacts.push(Emojis.arrow_forward);
                            };
                            post.embed.setDescription(desc);

                            if (isEnabled) [Emojis.del, Emojis.mega, Emojis.mute, Emojis.mic, Emojis.flag, Emojis.joystick].forEach((e: string) => reacts.push(e))
                            else reacts.push(Emojis.add);


                            return { post, reacts }
                        }, (react: djs.MessageReaction, s: StateProvider) => {
                            switch (react.emoji.name) {

                                case Emojis.del: this.disableChannel(s.state.data.onWorkingChannel); break;
                                case Emojis.add: this.enableChannel(s.state.data.onWorkingChannel, s.state.data.index); break;
                                case Emojis.mega: this.setName('chatting', s.state.data.index); break;
                                case Emojis.mute: this.setName('offline', s.state.data.index); break;
                                case Emojis.mic: this.setEmoji('chatting', s.state.data.index); break;
                                case Emojis.flag: this.setEmoji('offline', s.state.data.index); break;
                                case Emojis.joystick: this.setEmoji('gaming', s.state.data.index); break;
                                case Emojis.arrow_forward: this.form.posts.get('channel').display({ index: s.state.data.index + 1 }); break;
                                case Emojis.arrow_backward: this.form.posts.get('channel').display({ index: s.state.data.index - 1 }); break;
                                case Emojis.back: this.form.posts.get('channels').display({ guild: this.guild }); break;
                                case Emojis.end: this.form.close(true); break;
                            }
                        })

                    // this.conf = Promise.resolve({ post: this.post.id, chan: this.channel.id, form: configFormType.main });
                    // this.createForm(configFormType.main)
                    this.form.posts.get('main').display()
                    msg.reply('Voyons cela dans mon duplex ' + await this.form.fetchChannel());

                } catch (e) { console.error(e) }
            } else {
                msg.reply('❌ You must be admin to use the config command');
            }
        }).apply(this)
    }

    async awaitEmojis(msg?: string, done?: (emoji: string) => void): Promise<any> {
        try {
            let channel = await this.form.fetchChannel();
            this.secondPost = (this.secondPost === undefined) ? 'send' in channel && await channel.send(msg) : await this.secondPost.edit(msg);
            let reacts = await this.secondPost.awaitReactions((r: any, u: djs.GuildMember) => !!this.member && u.id == this.member.id, {
                max: 1
            });
            let emoji = reacts.first().emoji;
            if ('requiresColons' in emoji) {
                return this.awaitEmojis('❌ You must react with a __non custom__ emojis', done)
            } else {
                done(emoji.name);
                return this.secondPost.delete()
            }
        } catch (e) { console.error(e) }
    }

    async setEmoji(type: EmojisType, index: number) {
        try {
            await this.awaitEmojis('💬 React this message with a __unicode__ emojis to modify the *' + type + '* emojis', async (emoji: string) => {
                let chanConfig: IChannelsOptions = await this.chanConf;
                chanConfig.emojis[type] = emoji;
                this.chanConf = Promise.resolve(chanConfig);
            })
            return this.form.posts.get('channel').display({ index, guild: this.guild })
        } catch (e) { console.error(e) }
    }

    async awaitNames(msg?: string, done?: (name: string) => void): Promise<any> {
        try {
            let channel = await this.form.fetchChannel();

            this.secondPost = (this.secondPost === undefined) ? 'send' in channel && await channel.send(msg) : await this.secondPost.edit(msg);
            let msgs = 'awaitMessages' in channel && await channel.awaitMessages((m: djs.Message) => !!this.member && m.author.id == this.member.id, {
                max: 1
            });
            let reply = msgs.first();
            if (reply.content.length > 30) {
                return this.awaitNames('❌ You must reply with a __30 characters less__ name', done.bind(this))
            } else {
                done(reply.content);
                await reply.delete();
                await this.secondPost.delete();
                this.secondPost = undefined;
                return;
            }

        } catch (e) { console.error(e) }
    }

    async setName(type: NamesType, index: number) {
        try {
            await this.awaitNames('💬 Reply to this message with the *' + type + '* name you want to set', async (name: string) => {
                let chanConfig: IChannelsOptions = await this.chanConf;
                chanConfig.names[type] = name;
                this.chanConf = Promise.resolve(chanConfig);
            })
            return this.form.posts.get('channel').display({ index, guild: this.guild })
        } catch (e) { console.error(e) }
    }

    async setPrefix() {
        try {
            await this.awaitNames('💬 Reply to this message with the *prefix* you want to set', async (name: string) => {
                let guild: IGuildOptions = await Guilds.getGuild({ id: this.guild.id });
                guild.prefix = name;
                Guilds.updateGuild({ id: this.guild.id }, guild);
            })
            return this.form.posts.get('main').display({ guildId: this.guild.id })
        } catch (e) { console.error(e) }
    }

    async disableChannel(id: string) {
        try {
            let guild = await Guilds.getGuild({ id: this.guild.id });
            guild.channels.splice(guild.channels.indexOf(id), 1);
            await Guilds.updateGuild({ id: this.guild.id }, guild);
            await Channels.removeChannel({ id });
            return this.form.posts.get('channels').display({ guild: this.guild.id });
        } catch (e) { console.error(e) }
    }

    async enableChannel(id: string, index: number) {
        try {

            let guild = await Guilds.getGuild({ id: this.guild.id });
            await guild.channels.push(id);
            await Guilds.updateGuild({ id: this.guild.id }, guild)
            await Channels.addChannel({ id, offline: this.guild.channels.get(id).name, guildId: guild.id })
            return this.form.posts.get('channel').display({ index, guild: this.guild });
        } catch (e) { console.error(e) }
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
                this.reloadsChannels();
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
            Channels.updateChannel({ id }, conf);
        })();
    }

}