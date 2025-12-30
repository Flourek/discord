import { ChannelType, Collection, Events } from "discord.js";
import config from "../Base/config.js";
import { addBorderControlStat } from "../Handlers/database.js";

const cooldown = new Collection();

export default {
	name: Events.MessageCreate,
	async execute(message) {
		// Ignore bots and DMs
		if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;

		// Target channel ID
		const restrictedChannelId = "1450548000370982923";

		// Check if message was sent in that channel
		if (message.channel.id === restrictedChannelId) {
			try {
				// Get the GuildMember object
				const member = await message.guild.members.fetch(message.author.id);

				// Define 5 possible outcomes
				const outcomes = [
					{
						gif: "https://tenor.com/view/papers-please-gif-23166870",
						message: "📋 **Papers approved** - You may pass.",
						timeout: 0,
						outcome: "approved"
					},
					{
						gif: "https://tenor.com/view/papers-please-gif-23166877",
						message: "⚠️ **Discrepancy detected** - Minor violation.",
						timeout: 5 * 60 * 1000, // 5 minutes
						outcome: "minor_violation"
					},
					{
						gif: "https://tenor.com/view/detain-gif-26123735",
						message: "🚨 **DETAIN** - Security breach detected!",
						timeout: 10 * 60 * 1000, // 10 minutes
						outcome: "detained"
					},
					{
						gif: "https://tenor.com/view/unfunny-papers-please-gif-22986969",
						message: "😐 **Unfunny** - Brief holding.",
						timeout: 1 * 60 * 1000, // 1 minute
						outcome: "unfunny"
					},
					{
						gif: "https://tenor.com/view/jorji-costava-jorji-costava-papers-paper-gif-2234771689659361895",
						message: "🎉 **Jorji Costava!** - Welcome back, friend!",
						timeout: 0,
						outcome: "jorji"
					}
				];

				// Randomly select one of the 5 outcomes
				const selectedOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];

				// Send response with GIF
				await message.reply({
					content: `${selectedOutcome.gif}`
				});

				// Apply timeout if necessary
				if (selectedOutcome.timeout > 0) {
					await member.timeout(selectedOutcome.timeout, `Border Control: ${selectedOutcome.outcome}`);
				}

				// Track outcome in database
				addBorderControlStat(message.author.id, message.author.tag, selectedOutcome.outcome);

				console.log(`Border Control: ${selectedOutcome.outcome.toUpperCase()} for ${member.user.tag}${selectedOutcome.timeout > 0 ? ` - ${selectedOutcome.timeout / 60000} minute timeout` : ""}`);
			} catch (err) {
				console.error("Border Control error:", err);
			}
		}
	},
};
