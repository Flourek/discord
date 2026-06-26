import config from "../Base/config.js";
import { Events } from "discord.js";
import { PSP_GUILD } from "../Handlers/guilds.js";


const HALL_OF_FAME_CHANNEL_ID_FLOWERGARDEN = "1437882018833891490";
const HALL_OF_FAME_CHANNEL_ID_PSP = "1373765956949639259";
const STAR_EMOJI = "⭐";
const STAR_THRESHOLD = 1;
const STAR_THRESHOLD_PSP = 5;

export default {
	name: Events.MessageReactionAdd,
	async execute(reaction, user) {
		
		
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

		// Only track reactions in guild channels
		if (!reaction.message.guild) {
			return;
		}

		
		var channelID =  HALL_OF_FAME_CHANNEL_ID_FLOWERGARDEN
		var starThreshold = STAR_THRESHOLD;
		
		if ( reaction.message.guild?.id === PSP_GUILD ){
			starThreshold = STAR_THRESHOLD_PSP;
			channelID =  HALL_OF_FAME_CHANNEL_ID_PSP
		};
		
		console.log(reaction.message.guild.id, starThreshold, channelID, reaction.message.channelId)

		const { message } = reaction;
		const { client } = message;
		
		// Only track star emoji reactions
		if (reaction.emoji.name !== STAR_EMOJI) {
			return;
		}

		console.log("wtf")

		// Don't forward messages that are already in the hall of fame channel
		if (message.channelId === channelID) {
			return;
		}

		console.log("aga")
		console.log(reaction.count, starThreshold);
		
		// Check if threshold is met
		if (reaction.count < starThreshold) {
			return;
		}

		console.log("kurwa")


		const db = client.db;
		if (!db) {
			client.logger?.warn?.("Database not initialized; cannot record hall of fame entries.");
			return;
		}

		// Check if already forwarded to prevent duplicates and get halloffameEmbedId
		const alreadyForwarded = db
			.prepare("SELECT messageId, halloffameEmbedId FROM halloffame_messages WHERE messageId = ?")
			.get(message.id);


		console.log("suga")

		// If already forwarded, update the embed's star count if needed
		if (alreadyForwarded && alreadyForwarded.halloffameEmbedId) {
			try {
				const hofChannel = client.channels.cache.get(channelID);
				const hofMsg = await hofChannel?.messages.fetch(alreadyForwarded.halloffameEmbedId);
				if (hofMsg) {
					// Only update the stars field, do not change other embed fields
										const oldEmbed = hofMsg.embeds[0];
										const newEmbed = {
											...oldEmbed.toJSON(),
											author: {
												...oldEmbed.author,
												name: `${message.author?.displayName || message.author?.username || "Unknown"}   |  ${reaction.count} ${STAR_EMOJI}`,
											}
										};
										await hofMsg.edit({ embeds: [newEmbed] });
				}
			} catch (e) {
				client.logger?.error?.(`Failed to update hall of fame embed: ${e.message}`);
			}
			return;
		}

		console.log("wuga")

		if(!alreadyForwarded){

			try {
				// Send an embed with original author's name and profile picture and star count
				const author = message.author;
				const embed = {
					color: 0xff511c,
					author: {
						name: `${author?.displayName || author?.username || "Unknown"}   |  ${reaction.count} ${STAR_EMOJI}`,
						icon_url: author?.displayAvatarURL?.() || author?.avatarURL?.() || null,
					}
				};

				// Send embed first and store the sent message
				
				// Forward the original message
				await message.forward(channelID);
				const sentEmbedMsg = await client.channels.cache.get(channelID)?.send({ embeds: [embed] });

				// Record in database: original and embed message IDs
				db.prepare("INSERT OR IGNORE INTO halloffame_messages (messageId, halloffameEmbedId) VALUES (?, ?)" ).run(
					message.id,
					sentEmbedMsg?.id
				);
			} catch (error) {
				client.logger?.error?.(`Failed to forward hall of fame message: ${error.message}`);
			}
		}
	},

};
