import djs, { VoiceChannel, VoiceConnection, StreamDispatcher } from 'discord.js'
import form, { StateProvider } from 'djs-forms'
import Form from 'djs-forms';
import Queue, { ItemData } from './fiston-djs-player-queue'
import yt from 'yt-search';
import ytdl from 'ytdl-core-discord';

const yturl = 'https://www.youtube.com'

const EmojisN = ['0⃣', '1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];
const Emojis = {
    next: "⏩",
    back: "🔙",
    shuffle: "🔀",
    play: "▶",
    pause: "⏸",
    stop: "⏹",
    eject: "⏏",
    loop: "🔁",
    loop_one: "🔂",
    y: "✅",
    n: "❎",
};

export default class Player {
    public form: Form;
    public queue: Queue = new Queue();
    public isPaused: boolean = false;
    public isPlaying: boolean = false;
    public targetedVoiceChannel: VoiceChannel;
    public connection: VoiceConnection;
    public dispatcher: StreamDispatcher;
    public timer: NodeJS.Timeout;

    constructor(public client, public guild: djs.Guild) {

        this.form = form.create(client, guild, 'muzic', []);

        this.form.createPost('main')
            .setBuilder((ops: any) => {
                let embed = new djs.RichEmbed();

                let reacts = [Emojis.eject, Emojis.stop]
                if (this.queue.items.length == 0) {
                    embed.setDescription("Send yt link or a yt query to play music");
                } else if (this.queue.items.length == 1) {
                    embed.addField('Now Playing', `**${this.queue.getCurrent.title}**, __${this.queue.getCurrent.timestamp}__ added by ${this.guild.members.get(this.queue.getCurrent.dj)}`)
                } else if (this.queue.items.length == 2) {
                    embed
                        .addField('Now Playing', `**${this.queue.getCurrent.title}**, __${this.queue.getCurrent.timestamp}__ added by ${this.guild.members.get(this.queue.getCurrent.dj)}`)
                        .addField('Next', `**${this.queue.getNext.title}**, __${this.queue.getNext.timestamp}__ added by ${this.guild.members.get(this.queue.getNext.dj)}`);
                } else {
                    let queue = this.queue.all.reduce((Q, item, index) => {
                        if (index > 1) {
                            Q += `#${index - 1} **${item.title}**, __${item.timestamp}__\n`;
                            return Q;
                        }
                    }, '');
                    embed
                        .addField('Now Playing', `**${this.queue.getCurrent.title}**, __${this.queue.getCurrent.timestamp}__ added by ${this.guild.members.get(this.queue.getCurrent.dj)}`)
                        .addField('Next', `**${this.queue.getNext.title}**, __${this.queue.getNext.timestamp}__ added by ${this.guild.members.get(this.queue.getNext.dj)}`)
                        .addField('Queue', queue);
                }
                if (this.isPlaying) reacts.push(this.isPaused ? Emojis.play : Emojis.pause, Emojis.next)
                return {
                    post: {
                        embed,
                        content: this.targetedVoiceChannel.name,
                    },
                    reacts

                }
            }, (react: djs.MessageReaction) => {
                console.log('handled', react.emoji.name)
                //reset timer if skip
                switch (react.emoji.name) {
                    case Emojis.eject: this.form.close(true); break;
                    case Emojis.stop: this.stop(); break;
                    case Emojis.pause: this.pause(); break;
                    case Emojis.play: this.resume(); break;
                    case Emojis.next: this.next(); break;
                }
            })

        this.form.createPost('confirmator')
            .setPost((ops: any) => {
                let { obj, dj }: { obj: any, dj: string } = ops;
                ops.setStateData({ confirm: { obj, dj } });
                //ops.dj
                //ops.obj
                return {
                    embed: new djs.RichEmbed()
                        .setDescription(`Wanna add this song to queue?\n**${obj.title}**, __${obj.timestamp}__`),
                    content: this.targetedVoiceChannel.name

                }
            }).setReacts([Emojis.y, Emojis.n], (react: djs.MessageReaction, s: StateProvider) => {
                switch (react.emoji.name) {
                    case Emojis.y:
                        this.addToQueue(s.state.data.confirm.obj, s.state.data.confirm.dj);
                        if (!this.isPlaying) this.play(this.queue.getCurrent);
                        this.isPlaying = true;
                    case Emojis.n:
                        this.form.posts.get('main').display();
                        break;
                }
            })

        this.form.createPost('selector')
            .setBuilder((ops: any) => {
                let { obj, dj }: { obj: any, dj: string } = ops;
                ops.setStateData({ select: { obj, dj } });
                let reacts = [Emojis.back];
                let desc = ops.obj.reduce((D, item, index) => {
                    if (index < 11) {
                        reacts.push(EmojisN[index]);
                        D += `#${index} **${item.title}**, __${item.timestamp}__\n`;
                    }
                    return D;
                }, `Results: \n`);
                return {
                    post: {
                        embed: new djs.RichEmbed()
                            .setDescription(desc),
                        content: 'Dj Fiston'

                    },
                    reacts
                }
            }, (react: djs.MessageReaction, s: StateProvider) => {
                if (EmojisN.includes(react.emoji.name)) {
                    let index = EmojisN.indexOf(react.emoji.name);
                    this.addToQueue(s.state.data.select.obj[index], s.state.data.select.dj);
                    if (!this.isPlaying) this.play(this.queue.getCurrent);
                    this.isPlaying = true;
                    this.form.posts.get('main').display();
                } else if (react.emoji.name == Emojis.back) {
                    this.form.posts.get('main').display();
                }
            })


        this.form.onReplies((msg: djs.Message) => {
            if (msg.author.id == msg.client.user.id) return;
            if (msg.content.startsWith('https://www.youtube.com')) {
                yt(msg.content, (err, r) => {
                    if (err) throw new Error(err);
                    console.log(r.videos[0]);
                    this.form.posts.get('confirmator').display({ obj: r.videos[0], dj: msg.author.id });
                });
                msg.delete();
            } else {
                yt(msg.content, (err, r) => {
                    if (err) throw new Error(err);
                    this.form.posts.get('selector').display({ obj: r.videos, dj: msg.author.id });
                });
                msg.delete();
            }

        }, (msg: djs.Message) => true/* msg.content.startsWith('http') */ /* || msg.content.startsWith('yt') */)

    }

    public async play(data: ItemData) {

        let yt = await ytdl(data.url);
        this.timer = setTimeout(this.next.bind(this), data.duration);
        this.dispatcher = this.connection.playOpusStream(yt);
        this.form.posts.get('main').display();

    }

    public next() {
        this.dispatcher.end('next');
        this.form.posts.get('main').display();
        try {
            this.play(this.queue.next());
        } catch (e) {
            console.error(e);
        }
    }

    public pause() {
        if (!this.dispatcher.paused) this.dispatcher.pause();
        this.isPaused = this.dispatcher.paused;
        this.form.posts.get('main').display();

    }

    public resume() {
        if (this.dispatcher.paused) this.dispatcher.resume();
        this.isPaused = this.dispatcher.paused;
        this.form.posts.get('main').display();
    }

    public stop() {
        this.isPlaying = false;
        this.dispatcher.end('stop');
        this.queue.items = [];
        this.form.posts.get('main').display();
    }

    public async open(voiceChannel: VoiceChannel) {
        this.targetedVoiceChannel = voiceChannel;
        this.form.posts.get('main').display();
        this.connection = await voiceChannel.join();
    }


    public addToQueue(data: any, member: string) {
        this.queue.add({
            title: data.title,
            url: yturl + data.url,
            duration: 1001 * data.seconds,
            dj: member,
            timestamp: data.timestamp
        });

    }


}
