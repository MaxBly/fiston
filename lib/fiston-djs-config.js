const djs = require('discord.js');
const { Channels } = require('../models/Channels')
const { Guilds } = require('../models/Guilds')

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
    mega: "📣",
    mute: "🔇",
    joystick: "🕹",
    gear: "⚙"
}

class Config {
    constructor(msg) {
        let self = this;
        let authorId = msg.author.id;
        self.member = msg.guild.members.get(authorId);

        if (self.member.hasPermission('ADMINISTRATOR')) {

            self.guild = msg.guild;
            self.fetchConfigChannel('fiston-config', msg.guild).then(channel => {
                self.channel = channel
                console.log('FCC ok...', channel.name);
                msg.reply('Voyons cela dans mon duplex ' + channel);

                self.fetchConfigMessage(channel, msg.guild).then(post => {
                    self.post = post

                    console.log('FCM ok...', post.id)

                    self.conf = { msgId: post.id, form: 'main' };
                    let form = self.buildForm('main').then(form => {
                        self.sendForm(form).then(self.reactHandler.bind(self))
                            .catch(console.error);
                    }).catch(console.error);
                }).catch(console.error);
            }).catch(console.error);
        } else {
            msg.reply('nop t pas admin fdp');
        }
    }

    buildForm(form, ops) {
        return new Promise(async (resolve, reject) => {
            let emojis, embed;
            switch (form) {
                case 'main':
                    embed = new djs.RichEmbed()
                        .setTitle('`Le Fiston 🥃` *__Configuration__*')
                        .setDescription("__ __")
                        .setColor(16711680)
                        .addField("Channels :gear:", "Manage Channels")
                        .addField("Prefix :exclamation:", "Change guild prefix, current : !")
                    emojis = [Emojis.end, Emojis.gear, Emojis.prefix];
                    resolve({ embed, emojis })
                    break;

                case 'channels':
                    const voiceChannels = this.guild.channels.filter(c => c.type == 'voice')
                    const gsetttings = await Guilds.getGuild({ id: this.guild.id });

                    emojis = [Emojis.end, Emojis.back];
                    let channels = [];
                    let i = 0
                    let desc = voiceChannels.reduce((D, c) => {
                        console.log(i)
                        emojis.push(EmojisN[i])
                        channels.push(c.id)
                        D += `${EmojisN[i]} ${c.name} ${gsetttings.channels.includes(c.id) ? Emojis.on : Emojis.off}\n`;
                        i++;
                        return D;
                    }, "__ Channels :gear: __\n");

                    this.conf = { form: 'channels', data: { channels } };

                    embed = new djs.RichEmbed()
                        .setTitle('`Le Fiston 🥃` *__Configuration__*')
                        .setDescription(desc)
                        .setColor(16711680)
                    resolve({ embed, emojis })

                    break;

                case 'channel':
                    let { channelId } = ops;
                    embed = new djs.RichEmbed()
                        .setTitle('`Le Fiston 🥃` *__Configuration__*')
                        .setDescription(`__ Channel: ${this.guild.channels.get(channelId).name} __`)
                        .setColor(16711680)
                        .addField("Chatting Symbol :microphone2:", ":microphone2:", true)
                        .addField("Chatting Text :microphone2:", "Divulgachage entre amis", true)
                        .addField("Off Symbol :flag_white:", ":flag_white:", false)
                        .addField("Off Text :flag_white:", "Salon bien", true)
                        .addField("Gaming Symbol :joystick:", ":joystick:", true)
                    emojis = [Emojis.end, Emojis.back, Emojis.arrow_backward, Emojis.arrow_forward, Emojis.joystick, Emojis.mic, Emojis.flag, Emojis.mega, Emojis.mute];
                    this.conf = { form: 'channel', data: { channelId } };
                    resolve({ embed, emojis })
                    break;
            }
        });

    }


    async sendForm({ emojis, embed }) {
        await this.post.clearReactions();
        await this.post.edit(`${this.member} !`, embed);

        for (let e of emojis) {
            await this.post.react(e);
        }

        return this.continueAwaitingReactions();

    }

    continueAwaitingReactions() {
        return this.post.awaitReactions((r, u) => r.me && u.id == this.member.id, {
            max: 1
        });
    }

    async reactHandler(reacts) {

        const res = reacts.reduce((L, e) => {
            if (e.count == 2) L = e.emoji.name;
            return L;
        }, '')
        const state = await this.conf;
        if (EmojisN.includes(res)) {
            let index = EmojisN.indexOf(res);
            let channelId = state.data.channels[index];
            let form = await this.buildForm('channel', { channelId });
            let reacts = await this.sendForm(form);
            this.reactHandler(reacts)
        } else {
            switch (res) {
                case Emojis.end: this.channel.delete(); break;

                case Emojis.gear:
                    let form = await this.buildForm('channels');
                    let reacts = await this.sendForm(form);
                    this.reactHandler(reacts)
                    break;
                case Emojis.prefix:
                    this.channel.send(res)
                    break;
                case Emojis.back:
                    if (state.form == 'channels') {
                        let form = await this.buildForm('main');
                        let reacts = await this.sendForm(form);
                        this.reactHandler(reacts)
                    } else if (state.form == 'channel') {
                        let form = await this.buildForm('channels');
                        let reacts = await this.sendForm(form);
                        this.reactHandler(reacts)
                    }
                    break;
            }

        }
    }

    get conf() {
        return new Promise(async resolve => {
            let guild = await Guilds.getGuild({ id: this.guild.id });
            resolve(guild.configState);
        });
    }

    set conf(configState) {
        Guilds.updateGuild({ id: this.guild.id }, { configState });
    }

    fetchConfigMessage() {
        console.log('FCM...');
        return new Promise(async resolve => {
            let state = await this.conf;
            let msg;
            try {
                msg = await this.channel.fetchMessage(state.msgId);
                if (!msg) throw new Error('no config message');
                else resolve(msg);
            } catch (e) {
                msg = await this.channel.send('`Loading...`');
                resolve(msg);
            }
        })
    }

    fetchConfigChannel(configChannelName, guild) {
        console.log('FCC...');
        return new Promise(async resolve => {
            let configChannel;
            try {
                configChannel = guild.channels.find(c => c.name == configChannelName);
                if (!configChannel) throw new Error('no config channel');
                else resolve(configChannel);
            } catch (e) {
                let permission = [{ id: guild.id, deny: ['VIEW_CHANNEL'] }];
                configChannel = await guild.createChannel(configChannelName, 'text', permission);
                resolve(configChannel);
            }
        });
    }

}

module.exports = Config;
