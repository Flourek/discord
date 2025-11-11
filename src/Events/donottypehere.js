import { ChannelType, Collection, Events } from "discord.js";
import config from "../Base/config.js";
import { addTimeout } from "../Handlers/database.js";

const cooldown = new Collection();

export default {
	name: Events.MessageCreate,
	async execute(message) {
		// Ignore bots and DMs
		if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;

		// Ignore messages that start with the command prefix
		if (config.owners.includes(message.author.id)) return;

		// Target channel ID
		const restrictedChannelId = "1435809464845598823";

		// Check if message was sent in that channel
		if (message.channel.id === restrictedChannelId) {
			try {
				// Delete the message
				await message.delete();

				// Get the GuildMember object
				const member = await message.guild.members.fetch(message.author.id);

				// Timeout duration — 3 hours in milliseconds
				const duration = 3 * 60 * 60 * 1000;

				// Apply timeout
				await member.timeout(duration, "Sent a message in the restricted channel");

				// Track timeout in database
				addTimeout(message.author.id, message.author.tag);

				console.log(
					`Deleted message and timed out ${member.user.tag} for 3 hours for sending a message in #${message.channel.name}`
				);
			} catch (err) {
				console.error("Failed to delete message or timeout user:", err);
			}
		}
	},
};
