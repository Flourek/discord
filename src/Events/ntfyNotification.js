import WebSocket from 'ws';
import { Events } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: false,
    
    async execute(client) {
        const CHANNEL_ID = '1435803857954406522';
        const ws = new WebSocket('ws://ntfy.sh/flovrek/ws');

        ws.on('open', () => {
            client.logger.info('Connected to ntfy flovrek channel');
        });

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.event === 'message') {
                    const channel = client.channels.cache.get(CHANNEL_ID);
                    if (channel) {
                        await channel.send(`<@&1436413687664476180> ${message.message}`);
                    }
                }
            } catch (error) {
                client.logger.error('Error processing ntfy message:', error);
            }
        });

        ws.on('error', (error) => {
            client.logger.error('WebSocket error:', error);
        });

        ws.on('close', () => {
            client.logger.warn('WebSocket connection closed, attempting to reconnect...');
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.execute(client), 5000);
        });
    }
};
