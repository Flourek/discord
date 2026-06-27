import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord.js";

export const commandBase = {
	prefixData: {
		name: "sendf",
		aliases: ["say"],
	},
	slashData: new SlashCommandBuilder()
		.setName("send")
		.setDescription("Send a message as the bot (Owner only)")
		.addStringOption((option) =>
			option
				.setName("text")
				.setDescription("The message text to send")
				.setRequired(true),
		)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("Target channel (defaults to current)")
				.addChannelTypes(
					ChannelType.GuildText,
					ChannelType.GuildAnnouncement,
					ChannelType.GuildVoice,
				),
		)
		.addStringOption((option) =>
			option
				.setName("reply")
				.setDescription("Message ID to reply to (optional)"),
		),
	cooldown: 2000,
	ownerOnly: true,

	async prefixRun(message, args) {
		if (!args[0]) {
			return message
				.reply("Usage: `!send [channel] [messageId] <text>`")
				.then((reply) =>
					setTimeout(() => {
						message.delete().catch(() => { });
						reply.delete().catch(() => { });
					}, 5000),
				);
		}

		// Detect if first arg is a channel mention or raw ID
		const channelMention = args[0].match(/^<#(\d+)>$/);
		const possibleChannelId = channelMention
			? channelMention[1]
			: /^\d{16,20}$/.test(args[0])
				? args[0]
				: null;

		let channel = message.channel;
		let textStart = 0;

		if (possibleChannelId) {
			try {
				const fetched = await message.guild.channels.fetch(
					possibleChannelId,
				);
				if (fetched?.isTextBased()) {
					channel = fetched;
					textStart = 1;
				}
			} catch {
				// Not a valid channel, treat as text
			}
		}

		try {
			// Check for optional reply message ID (numeric arg at textStart)
			let replyTarget = null;

			if (
				args[textStart] &&
				/^\d{16,22}$/.test(args[textStart])
			) {
				try {
					replyTarget = await channel.messages.fetch(
						args[textStart],
					);
					textStart++;
				} catch {
					// Not a valid message ID, treat as part of text
				}
			}

			const text = args.slice(textStart).join(" ");
			if (!text) {
				return message
					.reply("Please provide text to send.")
					.then((reply) =>
						setTimeout(() => {
							message.delete().catch(() => { });
							reply.delete().catch(() => { });
						}, 5000),
					);
			}

			if (replyTarget) {
				await replyTarget.reply(text);
			} else {
				await channel.send(text);
			}

			message.delete().catch(() => { });
		} catch (err) {
			console.error("Error in prefix send:", err);
			message
				.reply("Failed to send the message. Check permissions.")
				.then((reply) =>
					setTimeout(() => {
						message.delete().catch(() => { });
						reply.delete().catch(() => { });
					}, 5000),
				);
		}
	},

	async slashRun(interaction) {
		const channel =
			interaction.options.getChannel("channel") || interaction.channel;
		const text = interaction.options.getString("text");
		const replyId = interaction.options.getString("reply");

		if (!channel.isTextBased()) {
			return interaction.reply({
				content: "That channel does not support text messages.",
				ephemeral: true,
			});
		}

		try {
			if (replyId) {
				const replyTarget = await channel.messages.fetch(replyId);
				await replyTarget.reply(text);
			} else {
				await channel.send(text);
			}

			interaction.reply({
				content: `Sent message to ${channel}.`,
				ephemeral: true,
			});
		} catch (err) {
			console.error("Error in slash send:", err);
			interaction.reply({
				content:
					"Failed to send the message. Check that the channel exists and the bot has permissions.",
				ephemeral: true,
			});
		}
	},
};
