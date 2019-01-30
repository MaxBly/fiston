var djs = require('discord.js');
var fs = require('fs');

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


    this.chanUpdate = (guild) => {
        self.getServers((err, servers) => {
            var data = servers[guild.id];
            if (data) data.forEach(settings => {
                if (err) throw err;
                var chan = guild.channels.get(settings.id)
                var members = chan.members.array();
                var gamesArr = [];
                members.forEach(member => {
                    if (member.presence.game && member.presence.game.type == 0) gamesArr.push(member.presence.game.name);
                    else gamesArr.push(settings.multigaming);
                });

                var gamesObj = {};
                gamesArr.forEach(game => {
                    if (gamesObj[game]) gamesObj[game]++;
                    else gamesObj[game] = 1;
                });

                var result = {
                    eq: false,
                    max: 0,
                    game: ""
                }

                Object.keys(gamesObj).forEach(game => {
                    if (gamesObj[game] > result.max) {
                        result.max = gamesObj[game]
                        result.game = game;
                        result.eq = false;
                    } else if (gamesObj[game] == result.max) result.eq = true;
                });

                if (members.length) {
                    if (result.eq) {
                        chan.setName(`${settings.symbols[1]} ${settings.multigaming}`);
                    } else {
                        chan.setName(`${settings.symbols[1]} ${result.game}`);
                    }
                } else {
                    chan.setName(`${settings.symbols[0]} ${settings.default}`);
                }
                console.log({result})
            });
        });
    }

    this.getServers = (callback) => {
        fs.readFile(__dirname + "/../json/servers.json", (err, data) => {
            if (err && typeof callback == 'function') callback(err);
            else callback(err, JSON.parse(data));
        });
    }

}

module.exports = Fiston;