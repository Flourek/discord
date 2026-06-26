import config from "../Base/config.js";

export const PSP_GUILD = "1366478030226198720";

// Events that bypass the guild restriction (run everywhere)
export const GLOBAL_EVENTS = [
    "halloffame.js",
    "clientReady.js",
    "interactionCreate.js",
    "ntfyNotification.js",
];

export function eventIsGlobal(filename){
    return GLOBAL_EVENTS.includes(filename);
}

export function getGuildFromArgs(args) {
    for (const arg of args) {
        if (arg?.guild?.id) return arg.guild.id;
        if (arg?.message?.guild?.id) return arg.message.guild.id;
        if (arg?.guildId) return arg.guildId;
    }
    return null;
}

export function isDefaultGuild(guildId) {
    return guildId === config.default_server;
}

