import { readdirSync } from "node:fs";
import { eventIsGlobal, getGuildFromArgs, isDefaultGuild} from "./guilds.js";

export default {
    async execute(client) {
        const eventFiles = readdirSync("./src/Events");

        Promise.all(
            eventFiles.map(async (file) => {
                const event = await import(`../Events/${file}`).then((x) => x.default);

                const handler = (...args) => {

                    if (!eventIsGlobal(file)) {
            client.logger.info('chuj');
                        const guildId = getGuildFromArgs(args);
                        if (!isDefaultGuild(guildId)){
                            return;
                        } 
                    }

                    event.execute(...args);
                };

                if (event.once) {
                    client.once(event.name, handler);
                } else {
                    client.on(event.name, handler);
                }
            }),
        );
    },
};
