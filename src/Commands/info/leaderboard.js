import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders";
import { getLeaderboard } from "../../Handlers/database.js";

export const commandBase = {
	prefixData: {
		name: "leaderboard",
		aliases: ["lb", "top"],
	},
	slashData: new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("View the timeout leaderboard")
		.addNumberOption((option) =>
			option
				.setName("limit")
				.setDescription("Number of top users to show (1-20)")
				.setMinValue(1)
				.setMaxValue(20)
		),
	cooldown: 5000,
	ownerOnly: false,

	async prefixRun(message, args) {
		const limit = parseInt(args[0]) || 10;
		if (limit < 1 || limit > 20) {
			return message.reply("Limit must be between 1 and 20");
		}

		const leaderboard = getLeaderboard(limit);

		if (leaderboard.length === 0) {
			return message.reply("No timeout records found.");
		}

		const embed = new EmbedBuilder()
			.setColor(0xff0000)
			.setTitle("⏰ Timeout Leaderboard")
			.setDescription(
				leaderboard
					.map(
						(user, index) =>
							`${index + 1}. **${user.username}** - ${user.timeoutCount} timeout${user.timeoutCount !== 1 ? "s" : ""}`
					)
					.join("\n")
			)
			.setFooter({ text: `Total records: ${leaderboard.length}` });

		message.reply({ embeds: [embed] });
	},

	async slashRun(interaction) {
		try {
			const limit = interaction.options.getNumber("limit") || 10;

			const leaderboard = getLeaderboard(limit);

			if (leaderboard.length === 0) {
				return interaction.reply({
					content: "No timeout records found.",
					flags: 64,
				});
			}

            const embed = new EmbedBuilder()
                .setColor(0xff511c)
                .setTitle("🚧 BORDER CROSSING ATTEMPTS 🚧")
                .setDescription(
                    leaderboard
                        .map(
                            (user, index) =>
                                `${user.username}: **${user.timeoutCount}** `
                        )
                        .join("\n") + "\n\n **5 Attempts = Special Role**"
						
                )
                .setFooter({ text: `Total records: ${leaderboard.length}` });

			interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error("Leaderboard error:", error);
			interaction.reply({
				content: "An error occurred while fetching the leaderboard.",
				flags: 64,
			});
		}
	},
};
