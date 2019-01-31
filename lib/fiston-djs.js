var djs = require('discord.js');
var fs = require('fs');
var FistonTwit = require('./fiston-twit');
var W = new FistonTwit();

function Fiston() {
    this.bot = new djs.Client();

    var self = this;

    this.bot.on('ready', _ => {
        self.getServers((err, servers) => {
            if (err) throw err;
            Object.keys(servers).forEach(id => {
                self.chanUpdate(self.bot.guilds.get(id));
            });
        })

    });

    this.bot.on('voiceStateUpdate', (oldMember, newMember) => {
        this.chanUpdate(newMember.guild);
    });

    this.bot.on('presenceUpdate', (oldMember, newMember) => {
        this.chanUpdate(newMember.guild);
    });

    this.bot.on('message', msg => {
        var cmd = msg.content.substring(1).split(' ')[0];
        var arg = msg.content.split(' ').slice(1);
        var args = arg.join(' ');
        switch (cmd.toLowerCase()) {
            case 'mot':
                console.log('mot');
                self.sendLastWord(msg)
                break;
        }
    });


    this.sendLastWord = msg => {
        W.getLastWord((err, word) => {
            self.sendWord(msg, word, form => {
                console.log({ form });
            });
        });
    }


    this.sendWord = (msg, word, callback) => {
        var form = new djs.RichEmbed()
            .setTitle('`Le Fiston 🥃` _**!mot**_')
            .setDescription("__ __")
            .setColor(16711680)
            .addField("Mot nul du jour :", word[0])
            .addField("Proposé par :", word[1])
        msg.channel.send({ embed: form });
        if (typeof callback == 'function') {
            callback(form);
        }
        msg.delete();
    }


    this.chanUpdate = guild => {
        self.getServers((err, servers) => {
            var data = servers[guild.id];
            if (data) data.forEach(settings => {
                if (err) throw err;
                var chan = guild.channels.get(settings.id)
                var members = chan.members.array();
                var gamesArr = [];
                members.forEach(member => {
                    if (member.presence.game && (member.presence.game.type == 0 || member.presence.game.type == 0)) gamesArr.push(member.presence.game.name);
                    else gamesArr.push(settings.multigaming);
                });

                var gamesObj = {};
                gamesArr.forEach(game => {
                    if (gamesObj[game]) gamesObj[game]++;
                    else gamesObj[game] = 1;
                });

                var result = {
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

}

module.exports = Fiston;