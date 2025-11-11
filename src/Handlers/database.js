import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../..", "timeouts.db");

let db = null;

export default {
	execute(botClient) {
		try {
			db = new Database(dbPath);
			db.pragma("journal_mode = WAL");

			// Create timeouts table if it doesn't exist
			db.exec(`
				CREATE TABLE IF NOT EXISTS timeouts (
					userId TEXT PRIMARY KEY,
					username TEXT NOT NULL,
					timeoutCount INTEGER DEFAULT 1,
					createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
					updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`);

			if (botClient.logger) {
				botClient.logger.info("Connected to SQLite database successfully");
			} else {
				console.log("Connected to SQLite database successfully");
			}
			botClient.db = db;
		} catch (error) {
			if (botClient.logger) {
				botClient.logger.error(`Failed to initialize database: ${error.message}`);
			} else {
				console.error(`Failed to initialize database: ${error.message}`);
			}
		}
	},
};

export function addTimeout(userId, username) {
	try {
		const existing = db.prepare("SELECT * FROM timeouts WHERE userId = ?").get(userId);

		if (existing) {
			db.prepare(
				"UPDATE timeouts SET timeoutCount = timeoutCount + 1, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?"
			).run(userId);
		} else {
			db.prepare(
				"INSERT INTO timeouts (userId, username, timeoutCount) VALUES (?, ?, 1)"
			).run(userId, username);
		}
	} catch (error) {
		console.error("Error adding timeout:", error);
	}
}

export function getLeaderboard(limit = 10) {
	try {
		const results = db
			.prepare(
				"SELECT userId, username, timeoutCount FROM timeouts ORDER BY timeoutCount DESC LIMIT ?"
			)
			.all(limit);
		return results;
	} catch (error) {
		console.error("Error fetching leaderboard:", error);
		return [];
	}
}
