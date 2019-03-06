const djs = require('discord.js');
const schedule = require('node-schedule');
const fs = require('fs');
const { Channels } = require('../models/Channels')
const { Guilds } = require('../models/Guilds')
const Config = require('./fiston-djs-config');

class Fiston {
    constructor(token) {
        this.bot = new djs.Client();
        this.bot.on('ready', async _ => {
            console.log('ready')
            //console.log(this.bot.emojis)


            /* let guilds = await Guilds.getGuilds({});
            console.log(guilds);
            guilds.forEach(({ id }) => {
                Guilds.getGuildChannels({ id }).then(this.chanUpdate).catch(console.error)
            }); */
        });

        this.bot.on('voiceStateUpdate', this.chanUpdaterHandler);
        this.bot.on('presenceUpdate', this.chanUpdaterHandler);
        this.bot.on('message', msg => {
            let cmd = msg.content.substring(1).split(' ')[0];
            let arg = msg.content.split(' ').slice(1);
            let args = arg.join(' ');
            switch (cmd.toLowerCase()) {
                case 'motdujour':
                    console.log('mot du jour');
                    this.sendLastWord(msg.channel)
                    msg.delete();
                    break;
                case 'nouveaumot':
                    console.log('nouveau mot');
                    //W.addWord(arg[0], arg[1]);
                    msg.reply('Ajouté ! :thumbsup:')
                    break;
                case 'c': new Config(msg); break;
                case 'd': msg.channel.delete(); break;
                case 'main': this.sendMainForm(msg); break;
                case 'channels': this.sendChannelsForm(msg); break;
                case 'channel': this.sendChannelForm(msg); break;
            }
        });
        this.bot.login(token)
    }

    chanUpdaterHandler(oldm, newm) {
        /* Guilds.getGuildChannels({ id: newm.guild.id })
            .then(this.chanUpdate)
            .catch(console.error); */
    }


    async reload(msg) {
        let channel = await Config.fetchConfigChannel('fiston-config', msg.guild)
        await channel.delete();
        new Config(msg)
    }

    schedule({ h, m }) {
        this.job = schedule.scheduleJob(`${m} ${h} * * *`, self.scheduleWord);
        let n = this.job.nextInvocation()
        console.log({
            year: n.getFullYear(),
            month: n.getMonth(),
            date: n.getDate(),
            day: n.getDay(),
            hours: n.getHours(),
            minutes: n.getMinutes(),
            seconds: n.getSeconds(),
        });
    }

    static sendWord(channel, word, callback) {
        let form = new djs.RichEmbed()
            .setTitle('`Le Fiston 🥃` _**!mot**_')
            .setDescription("__ __")
            .setColor(16711680)
            .addField("Mot nul du jour :", word[0])
            .addField("Proposé par :", word[1])
        channel.send({ embed: form });
        if (typeof callback == 'function') {
            callback(form);
        }
    }

    chanUpdate({ id, name, activity, offChar, onChar, guildId }) {
        return;
        let chan = this.bot.guild.get(guildId).channels.get(id)
        let members = chan.members.array();
        let gamesArr = members.reduce((arr, member) => {
            if (member.presence.game && member.presence.game.type == 0) arr.push(member.presence.game.name);
            else arr.push(activity);
        }, []);

        let gamesObj = gamesArr.reduce((obj, game) => {
            if (obj[game]) obj[game]++;
            else obj[game] = 1;
        }, {});

        let result = Object.keys(gamesObj).reduce((res, game) => {
            if (gamesObj[game] > res.max) {
                res.max = gamesObj[game]
                res.game = game;
            }
        }, { max: 0, game: "" });

        if (members.length) {
            chan.setName(`${onChar} ${activity}`);
        } else {
            chan.setName(`${offChar} ${name}`);
        }
        console.log({ result })
    }

}


module.exports = Fiston;    