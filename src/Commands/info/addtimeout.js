import { SlashCommandBuilder } from "@discordjs/builders";
import { addTimeout, getTimeouts } from "../../Handlers/database.js";

export const commandBase = {
	prefixData: {
		name: "addtimeout",
		aliases: ["addtimeouts", "timeout"],
	},
	slashData: new SlashCommandBuilder()
		.setName("addtimeout")
		.setDescription("Add timeouts to a user (Owner only)")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to add timeouts to")
				.setRequired(true)
		)
		.addNumberOption((option) =>
			option
				.setName("amount")
				.setDescription("Number of timeouts to add")
				.setMinValue(1)
				.setRequired(true)
		),
	cooldown: 2000,
	ownerOnly: true,

	async prefixRun(message, args) {
		if (!args[0] || !args[1]) {
			return message.reply("Usage: `!addtimeout <user mention/ID> <amount>`");
		}

		try {
			let userId = null;
			let username = null;

			// Get user from mention or ID
			const mention = message.mentions.users.first();
			if (mention) {
				userId = mention.id;
				username = mention.tag;
			} else {
				const idPattern = /^\d+$/;
				if (idPattern.test(args[0])) {
					userId = args[0];
					try {
						const user = await message.client.users.fetch(userId);
						username = user.tag;
					} catch {
						return message.reply("User not found.");
					}
				} else {
					return message.reply("Please mention a user or provide a valid user ID.");
				}
			}

			const amount = parseInt(args[1]);
			if (isNaN(amount) || amount < 1) {
				return message.reply("Amount must be a positive number.");
			}

			// Add timeouts using loop
			for (let i = 0; i < amount; i++) {
				addTimeout(userId, username);
			}

			const newCount = getTimeouts(userId);
			message.reply(
				`✅ Added **${amount}** timeout(s) to **${username}**. New total: **${newCount}** timeouts.`
			);
		} catch (err) {
			console.error("Error adding timeouts:", err);
			message.reply("Failed to add timeouts.");
		}
	},

	async slashRun(interaction) {
		try {
			const user = interaction.options.getUser("user");
			const amount = interaction.options.getNumber("amount");

			if (amount < 1) {
				return interaction.reply({
					content: "Amount must be at least 1.",
					ephemeral: true,
				});
			}

			// Add timeouts using loop
			for (let i = 0; i < amount; i++) {
				addTimeout(user.id, user.tag);
			}

			const newCount = getTimeouts(user.id);
			interaction.reply(
				`✅ Added **${amount}** timeout(s) to **${user.tag}**. New total: **${newCount}** timeouts.`
			);
		} catch (err) {
			console.error("Error adding timeouts:", err);
			interaction.reply({
				content: "Failed to add timeouts.",
				ephemeral: true,
			});
		}
	},
};
