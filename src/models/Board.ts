import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false, // Required for secure AWS Neon tech connection via node-postgres
  },
});

export default class BoardFunctions {
  /**
   * Initializes the boards table in Neon Postgres
   */
  static async initializeDatabase() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS boards (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          passcode VARCHAR(10),
          owner_id VARCHAR(255),
          editors TEXT,
          elements TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Neon Postgres: Boards table is ready.");
    } catch (err) {
      console.error("❌ Neon Postgres Init Error:", err);
      // Wait to throw, since it can crash nextjs randomly at startup if just logging
      // throw err; 
    }
  }

  /**
   * Cleans up boards older than 3 days
   */
  static async lazyCleanupExpiredBoards() {
    try {
      await pool.query(`DELETE FROM boards WHERE created_at < NOW() - INTERVAL '3 days';`);
      console.log("✅ Lazy cleanup executed.");
    } catch (err) {
      console.error("❌ Error cleaning up boards:", err);
    }
  }

  /**
   * Creates a new board record
   */
  static async createBoard(boardData: { _id: string, otp: string, ownerId: string, editors: string[], elements: any[] }) {
    try {
      await pool.query(
        `INSERT INTO boards (id, name, passcode, owner_id, editors, elements) VALUES ($1, $2, $3, $4, $5, $6)`,
        [boardData._id, 'Design Thinking Ideation', boardData.otp, boardData.ownerId, JSON.stringify(boardData.editors), JSON.stringify(boardData.elements)]
      );
      return boardData._id;
    } catch (err) {
      console.error("❌ Error in createBoard:", err);
      throw err;
    }
  }

  /**
   * Fetches a board by ID
   */
  static async getBoardById(id: string) {
    try {
      const res = await pool.query(`SELECT * FROM boards WHERE id = $1`, [id]);
      if (res.rows.length === 0) return null;
      
      const row = res.rows[0];
      return {
        _id: row.id,
        name: row.name,
        otp: row.passcode,
        ownerId: row.owner_id,
        editors: JSON.parse(row.editors || '[]'),
        elements: JSON.parse(row.elements || '[]'),
        createdAt: row.created_at
      };
    } catch (err) {
      console.error("❌ Error in getBoardById:", err);
      throw err;
    }
  }

  /**
   * Updates elements (shapes, pencil lines, etc.)
   */
  static async updateBoardElements(id: string, elements: any[]) {
    try {
      await pool.query(`UPDATE boards SET elements = $1 WHERE id = $2`, [JSON.stringify(elements), id]);
    } catch (err) {
      console.error("❌ Error in updateBoardElements:", err);
      throw err;
    }
  }

  /**
   * Add a new editor granting them permission
   */
  static async addEditor(id: string, userId: string) {
    try {
        const board = await this.getBoardById(id);
        if (!board) return;
        const editors = new Set(board.editors);
        editors.add(userId);
        await pool.query(`UPDATE boards SET editors = $1 WHERE id = $2`, [JSON.stringify(Array.from(editors)), id]);
    } catch (err) {
      console.error("❌ Error in addEditor:", err);
      throw err;
    }
  }
}