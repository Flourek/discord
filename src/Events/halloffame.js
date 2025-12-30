import { Events } from "discord.js";

const HALL_OF_FAME_CHANNEL_ID = "1437882018833891490";
const STAR_EMOJI = "⭐";
const STAR_THRESHOLD = 3;

export default {
	name: Events.MessageReactionAdd,
	async execute(reaction, user) {
		if (user.bot) {
			return;
		}

		try {
			if (reaction.partial) {
				reaction = await reaction.fetch();
			}

			if (reaction.message.partial) {
				reaction.message = await reaction.message.fetch();
			}
		} catch (error) {
			reaction.client?.logger?.error?.(`Failed to resolve partial reaction: ${error.message}`);
			return;
		}

		const { message } = reaction;
		const { client } = message;

		// Only track reactions in guild channels
		if (!message.guild) {
			return;
		}

		// Only track star emoji reactions
		if (reaction.emoji.name !== STAR_EMOJI) {
			return;
		}

		// Don't forward messages that are already in the hall of fame channel
		if (message.channelId === HALL_OF_FAME_CHANNEL_ID) {
			return;
		}

		// Check if threshold is met
		if (reaction.count < STAR_THRESHOLD) {
			return;
		}

		const db = client.db;
		if (!db) {
			client.logger?.warn?.("Database not initialized; cannot record hall of fame entries.");
			return;
		}

		// Check if already forwarded to prevent duplicates
		const alreadyForwarded = db
			.prepare("SELECT 1 FROM halloffame_messages WHERE messageId = ?")
			.get(message.id);

		if (alreadyForwarded) {
			return;
		}

		try {
			// Use Discord.js native forward method
			await message.forward(HALL_OF_FAME_CHANNEL_ID);

			// Record in database to prevent duplicate forwards
			db.prepare("INSERT OR IGNORE INTO halloffame_messages (messageId) VALUES (?)").run(
				message.id,
			);
		} catch (error) {
			client.logger?.error?.(`Failed to forward hall of fame message: ${error.message}`);
		}
	},
};
