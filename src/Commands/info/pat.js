
import { SlashCommandBuilder } from "@discordjs/builders";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const commandBase = {
	prefixData: {
		name: "pat",
		aliases: ["pet"],
	},
	slashData: new SlashCommandBuilder().setName("pat").setDescription("Waga"),
	// If you want to improve the command, check the guide: https://discordjs.guide/slash-commands/advanced-creation.html
	cooldown: 5000, // 1 second = 1000 ms / set to 0 if you don't want a cooldown.
	ownerOnly: false, // Set to true if you want the command to be usable only by the developer.
	async prefixRun(message, args) {
		message.reply("Pong 🏓");
	},
	slashRun(interaction) {
			const user = interaction.user;
			const avatarURL = user.displayAvatarURL({ format: 'png', size: 256 });

			// Get all image files in welcome folder
			const welcomeDir = path.join(import.meta.dirname ?? path.dirname(import.meta.url), '../../assets/welcome');
			const files = fs.readdirSync(welcomeDir).filter(f => f.endsWith('.png') || f.endsWith('.gif') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
			const randomFile = files[Math.floor(Math.random() * files.length)];
			const randomImagePath = path.join(welcomeDir, randomFile);

            fetch(avatarURL)
                .then(res => res.arrayBuffer())
                .then(buf => Buffer.from(buf))
                .then(avatarBuffer => {
                    sharp(avatarBuffer)
                    .resize(96, 96)
                    .toBuffer()
                    .then(resizedAvatar => {
                        sharp(randomImagePath)
                            .resize({ height: 96 })
                            .toBuffer()
                            .then(welcomeBuffer => {
                                sharp(resizedAvatar).metadata().then(meta => {
                                    sharp(welcomeBuffer).metadata().then(wMeta => {
                                        const totalWidth = meta.width + wMeta.width;
                                        sharp({
                                            create: {
                                                width: totalWidth,
                                                height: 96,
                                                channels: 4,
                                                background: { r: 0, g: 0, b: 0, alpha: 0 }
                                            }
                                        })
                                            .composite([
                                                { input: resizedAvatar, left: 0, top: 0 },
                                                { input: welcomeBuffer, left: meta.width, top: 0 }
                                            ])
                                            .png()
                                            .toBuffer()
                                            .then(finalBuffer => {
                                                interaction.reply({
                                                    files: [{ attachment: finalBuffer, name: 'concat.png' }],
                                                    content: `${user.username}'s profile + random image:`
                                                });
                                            })
                                            .catch(() => {
                                                interaction.reply({ content: 'Failed to process image.', flags: 64 });
                                            });
                                    });
                                });
                            })
                            .catch(() => {
                                interaction.reply({ content: 'Failed to process image.', flags: 64 });
                            });
                    })
                    .catch(() => {
                        interaction.reply({ content: 'Failed to process image.', flags: 64 });
                    });
            })
            .catch(() => {
                interaction.reply({ content: 'Failed to process image.', flags: 64 });
            });
	},
};
