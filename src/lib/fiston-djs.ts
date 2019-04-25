import djs, { ChannelData, Guild } from 'discord.js'
import schedule from 'node-schedule'
import { Channels, IChannelsOptions } from '../models/Channels'
import { Guilds, IGuildOptions } from '../models/Guilds'
import Config from './fiston-djs-config'
import Player from './fiston-djs-player'
const emojis = { flag: "🏳", mic: "🎙", joystick: "🕹" }

export interface IChannelData {
    id: string,
    guildId: string,
    names: {
        offline: string,
        chatting: string,
    },
    emojis: {
        offline: string,
        chatting: string,
        gaming: string,
    }
}

export default class Fiston {
    bot: djs.Client;
    config: Config;
    player: Player;
    constructor(token?: string) {
        this.bot = new djs.Client();
        this.bot.on('ready', async () => {
            console.log('ready')
            this.reloadsChannels();
        });

        this.bot.on('voiceStateUpdate', this.chanUpdaterHandler.bind(this));
        this.bot.on('guildCreate', ({ id }: { id: djs.Snowflake }) => Guilds.addGuild(id));
        this.bot.on('guildDelete', ({ id }: { id: djs.Snowflake }) => Guilds.removeGuild({ id }));
        this.bot.on('presenceUpdate', this.chanUpdaterHandler.bind(this));
        this.bot.on('message', async (msg: djs.Message) => {
            try {
                let guild = await Guilds.getGuild({ id: msg.guild.id })
                let prefix = ('prefix' in guild) ? guild.prefix : '!';
                if (msg.content.startsWith(prefix)) {

                    let cmd = msg.content.substring(prefix.length).split(' ')[0];
                    let arg = msg.content.split(' ').slice(1);
                    let args = arg.join(' ');
                    switch (cmd.toLowerCase()) {
                        case 'config': this.config = new Config(msg, this.reloadsChannels.bind(this)); break;
                        case 'cbi': this.clear(msg); break;
                        case 'play': this.play(msg); break;
                    }
                }

            } catch (e) {
                console.error(e)

            }
        });
        this.bot.login(token)
    }

    async reloadsChannels() {
        let guilds = await Guilds.getGuilds({});
        guilds.forEach(({ id }) => {
            Guilds.getGuildChannels({ id }, this.chanUpdate.bind(this))
        });
    }

    async play(msg: djs.Message) {
        try {
            this.player = new Player(msg.client, msg.guild)
            this.player.open(msg.member.voiceChannel)
        } catch (e) { console.error(e) }
    }


    async clear(msg: djs.Message) {
        let member = msg.guild.members.get(msg.author.id)
        if (member.hasPermission('ADMINISTRATOR')) {
            let msgs = await msg.channel.fetchMessages({})
            msgs.filter((m: djs.Message) => m.author.id == this.bot.user.id || m.author.id == msg.author.id)
                .map((m: djs.Message) => m.delete());
        }
    }


    async chanUpdaterHandler(oldm: any, newm: any) {
        try {
            Guilds.getGuildChannels({ id: newm.guild.id }, this.chanUpdate.bind(this))
        } catch (e) { console.log(e) }
    }

    schedule(time: { h: number, m: number }) {
        /* this.job = schedule.scheduleJob(`${time.m} ${time.h} * * *`, self.scheduleWord);
        let n = this.job.nextInvocation()
        console.log({
            year: n.getFullYear(),
            month: n.getMonth(),
            date: n.getDate(),
            day: n.getDay(),
            hours: n.getHours(),
            minutes: n.getMinutes(),
            seconds: n.getSeconds(),
        }); */
    }

    static sendWord(channel: any, word: any) {
        /* return new Promise(async resolve => {
            let form = new djs.RichEmbed()
                .setTitle('`Le Fiston 🥃` _**!mot**_')
                .setDescription("__ __")
                .setColor(16711680)
                .addField("Mot nul du jour :", word[0])
                .addField("Proposé par :", word[1])
            await channel.send({ embed: form });
            resolve(form);
        }); */
    }


    chanUpdate({ id, guildId, names, emojis }: IChannelsOptions) {
        let chan: any = this.bot.guilds.get(guildId).channels.get(id)
        let members: djs.GuildMember[] = chan.members.array();
        let gamesArr: string[] = members.reduce((arr: string[], member: any) => {
            if (member.presence.game && member.presence.game.type == 0) arr.push(member.presence.game.name);
            return arr;
        }, []);

        let gamesObj: any = gamesArr.reduce((obj: any, game: string) => {
            if (obj[game]) obj[game]++;
            else obj[game] = 1;
            return obj;
        }, {});

        let result: any = Object.keys(gamesObj).reduce((res: any, game: string) => {
            if (gamesObj[game] > res.max) {
                res.max = gamesObj[game];
                res.game = game;
            }
            return res;
        }, { max: 0, game: "" });

        if (members.length) {
            if (members.length == result.max) chan.setName(`${emojis.gaming} ${result.game}`);
            else chan.setName(`${emojis.chatting} ${names.chatting}`);
        } else {
            chan.setName(`${emojis.offline} ${names.offline}`);
        }
    }

}