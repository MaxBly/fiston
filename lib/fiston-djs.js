const djs = require('discord.js');
const schedule = require('node-schedule');
const fs = require('fs');
const FistonTwit = require('./fiston-twit');
const W = new FistonTwit();

function Fiston(token, time) {
    let self = this;

    if (token) {
        this.bot = new djs.Client();

        this.bot.on('ready', _ => {
            self.getServers((err, servers) => {
                if (err) throw err;
                Object.keys(servers).forEach(id => {
                    self.chanUpdate(self.bot.guilds.get(id));
                });
            });
            self.scheduledWord()
            debugger;

        });

        this.bot.on('voiceStateUpdate', (oldMember, newMember) => {
            this.chanUpdate(newMember.guild);
        });

        this.bot.on('presenceUpdate', (oldMember, newMember) => {
            this.chanUpdate(newMember.guild);
        });

        this.bot.on('message', msg => {
            let cmd = msg.content.substring(1).split(' ')[0];
            let arg = msg.content.split(' ').slice(1);
            let args = arg.join(' ');
            switch (cmd.toLowerCase()) {
                case 'motdujour':
                    console.log('mot du jour');
                    self.sendLastWord(msg.channel)
                    msg.delete();
                    break;
                case 'nouveaumot':
                    console.log('nouveau mot');
                    W.addWord(arg[0], arg[1]);
                    msg.reply('Ajouté ! :thumbsup:')
                    break;
                case 'addchannel':
                case 'delchannel':
                case 'showchannel':

                    break;
            }
        });


        this.bot.login(token)

    }

    this.schedule = ({ h, m }) => {
        if (!token) return;
        this.job = schedule.scheduleJob(`${m} ${h} * * *`, self.scheduleWord);
        with (this.job.nextInvocation()) {
            console.log({
                year: getFullYear(),
                month: getMonth(),
                date: getDate(),
                day: getDay(),
                hours: getHours(),
                minutes: getMinutes(),
                seconds: getSeconds(),
            });
        }
    }

    this.scheduledWord = _ => {
        if (!token) return;
        let channel = self.bot.guilds
            .map(g => g.channels
                .filter(r => r.type == "text")
                .filter(r => r.name == "fiston")
                .filter(c => c)
            )
        console.log({ channel })
        debugger
        /* self.bot.guilds.forEach(e => {
            if (e.channels.find('name', 'fiston'))
                self.sendLastWord(e.channels.find('name', 'fiston'));
        }); */
    }

    this.sendLastWord = channel => {
        W.getLastWord((err, word) => {
            self.sendWord(channel, word, form => {
                console.log({ form });
            });
        });
    }

    this.sendNWord = (channel, n) => {
        W.getWords((err, words) => {
            self.sendWord(channel, words[n], form => {
                console.log({ form });
            });
        });
    }


    this.sendWord = (channel, word, callback) => {
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


    this.chanUpdate = guild => {
        self.getServers((err, servers) => {
            let data = servers[guild.id];
            if (data) data.forEach(settings => {
                if (err) throw err;
                let chan = guild.channels.get(settings.id)
                let members = chan.members.array();
                let gamesArr = [];
                members.forEach(member => {
                    if (member.presence.game && (member.presence.game.type == 0 || member.presence.game.type == 0)) gamesArr.push(member.presence.game.name);
                    else gamesArr.push(settings.multigaming);
                });

                let gamesObj = {};
                gamesArr.forEach(game => {
                    if (gamesObj[game]) gamesObj[game]++;
                    else gamesObj[game] = 1;
                });

                let result = {
                    max: 0,
                    game: ""
                }

                Object.keys(gamesObj).forEach(game => {
                    if (gamesObj[game] > result.max) {
                        result.max = gamesObj[game]
                        result.game = game;
                    }
                });

                if (members.length) {
                    chan.setName(`${settings.symbols[1]} ${result.game}`);
                } else {
                    chan.setName(`${settings.symbols[0]} ${settings.default}`);
                }
                console.log({ result })
            });
        });
    }

    this.getServers = callback => {
        fs.readFile(__dirname + "/../json/servers.json", (err, data) => {
            if (err && typeof callback == 'function') callback(err);
            else callback(err, JSON.parse(data));
        });
    }

    this.addServers = (id, data) => {
        self.getServers((err, servers) => {
            if (servers[id]) {
                servers[id].push(data);
            } else {
                //merge objects
            }
            //save servers.json
        });
    }
    //this.delServers...
}

module.exports = Fiston;