import djs, { ChannelData, Guild } from 'discord.js'
import schedule from 'node-schedule'
import fs from 'fs'
import { Channels, IChannelsOptions } from '../models/Channels'
import { Guilds, IGuildOptions } from '../models/Guilds'
import Config from './fiston-djs-config'

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
    public bot: djs.Client;

    constructor(token?: string) {
        this.bot = new djs.Client();
        this.bot.on('ready', async () => {
            console.log('ready')
            let guilds = await Guilds.getGuilds({});
            guilds.forEach(async ({ id }) => {
                for await (let channel of Guilds.getGuildChannels({ id })) {
                    this.chanUpdate(channel)
                }
            });
        });

        this.bot.on('voiceStateUpdate', this.chanUpdaterHandler);
        this.bot.on('presenceUpdate', this.chanUpdaterHandler);
        this.bot.on('message', (msg: any) => {
            let cmd = msg.content.substring(1).split(' ')[0];
            let arg = msg.content.split(' ').slice(1);
            let args = arg.join(' ');
            switch (cmd.toLowerCase()) {
                case 'c': new Config(msg); break;
                case 'd': msg.channel.delete(); break;
            }
        });
        this.bot.login(token)
    }

    async chanUpdaterHandler(oldm: any, newm: any) {
        try {
            for await (let channel of Guilds.getGuildChannels({ id: newm.guild.id })) {
                this.chanUpdate(channel)
            }
        } catch (e) { console.error(e) }
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


    static chanUpdate(channel: IChannelsOptions) {
        console.log({ channel })
        let { id, guildId, names, emojis } = channel;
        let chan: any = this.bot.guilds.get(guildId).channels.get(id)
        let members = chan.members.array();
        let gamesArr = members.reduce((arr: string[], member: any) => {
            if (member.presence.game/*  && member.presence.game.type == 0 */) arr.push(member.presence.game.name);
        }, []);

        let gamesObj = gamesArr.reduce((obj: any, game: string) => {
            if (obj[game]) obj[game]++;
            else obj[game] = 1;
            return obj;
        }, {});

        let result = Object.keys(gamesObj).reduce((res: any, game: string) => {
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
        console.log({ result })
    }

}