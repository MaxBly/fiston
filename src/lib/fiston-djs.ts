import djs from 'discord.js'
import schedule from 'node-schedule'
import fs from 'fs'
import { Channels } from '../models/Channels'
import { Guilds } from '../models/Guilds'
import Config from './fiston-djs-config'

export default class Fiston {
    public bot: djs.Client;

    constructor(token?: string) {
        this.bot = new djs.Client();
        this.bot.on('ready', async () => {
            console.log('ready')
            //console.log(this.bot.emojis)
            /*
            let guilds = await Guilds.getGuilds({});
            guilds.forEach(async ({ id }) => {
                for await (let channel of Guilds.getGuildChannels({id})) {
                    this.chanUpdate(channel)
                }
            }); */
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

    chanUpdaterHandler(oldm: any, newm: any) {
        /* Guilds.getGuildChannels({ id: newm.guild.id })
            .then(this.chanUpdate)
            .catch(console.error); */
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

    chanUpdate(channel: any) {
        let { id, name, activity, guildId } = channel;

        const emojis = { flag: "🏳", mic: "🎙", joystick: "🕹", }
        let chan: any = this.bot.guilds.get(guildId).channels.get(id)
        let members = chan.members.array();
        let gamesArr = members.reduce((arr: string[], member: any) => {
            if (member.presence.game && member.presence.game.type == 0) arr.push(member.presence.game.name);
            else arr.push(activity);
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
            chan.setName(`${emojis.mic} ${activity}`);
        } else {
            chan.setName(`${emojis.flag} ${name}`);
        }
        console.log({ result })
    }

}