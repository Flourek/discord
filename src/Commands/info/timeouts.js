import { SlashCommandBuilder } from "@discordjs/builders";
import { getTimeouts } from "../../Handlers/database.js";

export const commandBase = {
	prefixData: {
		name: "timeouts",
		aliases: ["mytimeouts", "timeoutcount"],
	},
	slashData: new SlashCommandBuilder()
		.setName("timeouts")
		.setDescription("Check your timeout count or another user's")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to check timeouts for (optional)")
				.setRequired(false)
		),
	cooldown: 100,
	ownerOnly: false,
	async prefixRun(message, args) {
		try {
			let userId = message.author.id;
			let targetUser = message.author;

			// Check if a user mention or ID was provided
			if (args.length > 0) {
				const mention = message.mentions.users.first();
				if (mention) {
					userId = mention.id;
					targetUser = mention;
				} else {
					// Try to parse as ID
					const idPattern = /^\d+$/;
					if (idPattern.test(args[0])) {
						userId = args[0];
						try {
							targetUser = await message.client.users.fetch(userId);
						} catch {
							return message.reply("User not found.");
						}
					} else {
						return message.reply("Please mention a user or provide a valid user ID.");
					}
				}
			}

			const timeoutCount = getTimeouts(userId);
			const isOwn = userId === message.author.id;
			const text = isOwn ? "You've" : `${targetUser.tag} has`;
			message.reply(`🚧 ${text} been shot **${timeoutCount}** times.`);
		} catch (err) {
			console.error("Error fetching timeouts:", err);
			message.reply("Failed to fetch timeout count.");
		}
	},
	async slashRun(interaction) {
		try {
			let userId = interaction.user.id;
			let targetUser = interaction.user;

			// Check if user option was provided
			const userOption = interaction.options.getUser("user");
			if (userOption) {
				userId = userOption.id;
				targetUser = userOption;
			}

			const timeoutCount = getTimeouts(userId);
			const isOwn = userId === interaction.user.id;
			const text = isOwn ? "You've" : `${targetUser.tag} has`;
			interaction.reply(`🚧 ${text} been shot **${timeoutCount}** times.`);
		} catch (err) {
			console.error("Error fetching timeouts:", err);
			interaction.reply({
				content: "Failed to fetch timeout count.",
				ephemeral: true,
			});
		}
	},
};
