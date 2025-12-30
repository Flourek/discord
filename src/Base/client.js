import { readdirSync } from "node:fs";
import { Client, GatewayIntentBits, Partials } from "discord.js";

export default class BaseClient {
	constructor(token) {
		this.client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildMessageReactions
			],
			partials: [
				Partials.User,
				Partials.GuildMember,
				Partials.Message,
				Partials.Reaction,
				Partials.Channel
			],
			shards: "auto",
		});
		this.token = token;
	}

	loadHandlers() {
		readdirSync("./src/Handlers").forEach(async (file) => {
			const handlerFile = await import(`../Handlers/${file}`);
			const handler = handlerFile.default;
			handler.execute(this.client);
		});
	}

	start() {
		this.loadHandlers();
		this.client.login(this.token);
	}
}
