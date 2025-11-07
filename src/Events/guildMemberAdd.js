import { Events, AttachmentBuilder } from 'discord.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
	name: Events.GuildMemberAdd,
	once: false,
	async execute(member) {
		const channel = member.guild.channels.cache.get('1435803705499713600');
		if (!channel) return;

		try {
			// === 1️⃣ Download user avatar
			const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
			const avatarBuffer = Buffer.from(await fetch(avatarURL).then(r => r.arrayBuffer()));

			// === 2️⃣ Pick a random image from assets/welcome/
			const welcomeDir = path.join(__dirname, '../assets/welcome');
			const files = fs.readdirSync(welcomeDir)
				.filter(f => /\.(png|jpe?g|gif)$/i.test(f));

			if (!files.length) throw new Error('No welcome images found!');
			const randomFile = files[Math.floor(Math.random() * files.length)];
			const randomImagePath = path.join(welcomeDir, randomFile);

			// === 3️⃣ Resize both images
			const resizedAvatar = await sharp(avatarBuffer)
				.resize(96, 96)
				.png()
				.toBuffer();

			const welcomeBuffer = await sharp(randomImagePath)
				.resize({ height: 96 })
				.png()
				.toBuffer();

			// === 4️⃣ Get dimensions
			const avatarMeta = await sharp(resizedAvatar).metadata();
			const welcomeMeta = await sharp(welcomeBuffer).metadata();
			const totalWidth = avatarMeta.width + welcomeMeta.width;

			// === 5️⃣ Combine them horizontally
			const combined = await sharp({
				create: {
					width: totalWidth,
					height: 96,
					channels: 4,
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				},
			})
				.composite([
					{ input: resizedAvatar, left: 0, top: 0 },
					{ input: welcomeBuffer, left: avatarMeta.width, top: 0 },
				])
				.png()
				.toBuffer();

			// === 6️⃣ Send to channel
			const attachment = new AttachmentBuilder(combined, { name: 'welcome.png' });

			await channel.send({
				content: `Welcome to the server, ${member.user.toString()}! You are member #${member.guild.memberCount}`,
				files: [attachment],
			});

		} catch (error) {
			console.error('Error processing welcome image:', error);
			await channel.send(`Welcome ${member.user.toString()}! Now at ${member.guild.memberCount} members.`);
		}
	},
};
