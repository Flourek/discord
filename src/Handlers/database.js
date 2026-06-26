import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../sqlite", "timeouts.db");

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

			// Create border control stats table
			db.exec(`
				CREATE TABLE IF NOT EXISTS bordercontrol (
					userId TEXT PRIMARY KEY,
					username TEXT NOT NULL,
					approvedCount INTEGER DEFAULT 0,
					minorViolationCount INTEGER DEFAULT 0,
					detainedCount INTEGER DEFAULT 0,
					unfunnyCount INTEGER DEFAULT 0,
					jorjiCount INTEGER DEFAULT 0,
					createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
					updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`);

			// Track messages that have already been forwarded to the hall of fame
			// Migrate halloffame_messages table to add halloffameEmbedId if missing
			db.exec(`
				CREATE TABLE IF NOT EXISTS halloffame_messages (
					messageId TEXT PRIMARY KEY,
					halloffameEmbedId TEXT,
					forwardedAt DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`);
			// Add halloffameEmbedId column if it doesn't exist
			try {
				const columns = db.prepare("PRAGMA table_info(halloffame_messages)").all();
				if (!columns.some(col => col.name === "halloffameEmbedId")) {
					db.exec("ALTER TABLE halloffame_messages ADD COLUMN halloffameEmbedId TEXT");
				}
			} catch (e) {
				console.error("Failed to migrate halloffame_messages table:", e);
			}

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

export function getTimeouts(userId) {
	try {
		const result = db.prepare("SELECT timeoutCount FROM timeouts WHERE userId = ?").get(userId);
		return result ? result.timeoutCount : 0;
	} catch (error) {
		console.error("Error fetching timeouts:", error);
		return 0;
	}
} 

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

export function addBorderControlStat(userId, username, outcome) {
	try {
		const existing = db.prepare("SELECT * FROM bordercontrol WHERE userId = ?").get(userId);

		const columnMap = {
			approved: "approvedCount",
			minor_violation: "minorViolationCount",
			detained: "detainedCount",
			unfunny: "unfunnyCount",
			jorji: "jorjiCount"
		};

		const column = columnMap[outcome];
		if (!column) {
			console.error(`Unknown outcome: ${outcome}`);
			return;
		}

		if (existing) {
			db.prepare(
				`UPDATE bordercontrol SET ${column} = ${column} + 1, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`
			).run(userId);
		} else {
			db.prepare(
				`INSERT INTO bordercontrol (userId, username, ${column}) VALUES (?, ?, 1)`
			).run(userId, username);
		}
	} catch (error) {
		console.error("Error adding border control stat:", error);
	}
}

export function getBorderControlStats(userId) {
	try {
		const result = db.prepare("SELECT * FROM bordercontrol WHERE userId = ?").get(userId);
		return result || { 
			approvedCount: 0, 
			minorViolationCount: 0, 
			detainedCount: 0, 
			unfunnyCount: 0, 
			jorjiCount: 0 
		};
	} catch (error) {
		console.error("Error fetching border control stats:", error);
		return { 
			approvedCount: 0, 
			minorViolationCount: 0, 
			detainedCount: 0, 
			unfunnyCount: 0, 
			jorjiCount: 0 
		};
	}
}
