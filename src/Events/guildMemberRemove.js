import { Events } from 'discord.js';

export default {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(member) {
        const channel = member.guild.channels.cache.get('1435803705499713600');
        if (!channel) return;

        await channel.send(`${member.user.toString()} left the server... <a:skip:1436450836489175263>`);
    }
};