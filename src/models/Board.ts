import dbConnect from '../lib/mssql';
import sql from 'mssql';

export interface BoardElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  points?: number[];
}

export interface BoardData {
  _id: string;
  otp: string;
  ownerId: string;
  editors: string[];
  elements: BoardElement[];
  createdAt: Date;
}

export async function initializeDatabase() {
  const pool = await dbConnect();
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Boards' and xtype='U')
    CREATE TABLE Boards (
      _id VARCHAR(50) PRIMARY KEY,
      otp VARCHAR(10) NOT NULL,
      ownerId VARCHAR(50) NOT NULL,
      editors NVARCHAR(MAX) NOT NULL,
      elements NVARCHAR(MAX) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function createBoard(board: Omit<BoardData, 'createdAt'>): Promise<void> {
  const pool = await dbConnect();
  await pool.request()
    .input('_id', sql.VarChar(50), board._id)
    .input('otp', sql.VarChar(10), board.otp)
    .input('ownerId', sql.VarChar(50), board.ownerId)
    .input('editors', sql.NVarChar(sql.MAX), JSON.stringify(board.editors || []))
    .input('elements', sql.NVarChar(sql.MAX), JSON.stringify(board.elements || []))
    .query(`
      INSERT INTO Boards (_id, otp, ownerId, editors, elements)
      VALUES (@_id, @otp, @ownerId, @editors, @elements)
    `);
}

export async function getBoardById(id: string): Promise<BoardData | null> {
  const pool = await dbConnect();
  const result = await pool.request()
    .input('_id', sql.VarChar(50), id)
    .query(`
      SELECT _id, otp, ownerId, editors, elements, createdAt
      FROM Boards
      WHERE _id = @_id
    `);

  if (result.recordset.length === 0) return null;
  const row = result.recordset[0];
  
  // Date logical deletion check: if older than 3 days, delete it and return null
  const now = new Date();
  const diffDays = (now.getTime() - new Date(row.createdAt).getTime()) / (1000 * 3600 * 24);
  if (diffDays >= 3) {
    await deleteBoardById(id);
    return null;
  }

  return {
    _id: row._id,
    otp: row.otp,
    ownerId: row.ownerId,
    editors: JSON.parse(row.editors),
    elements: JSON.parse(row.elements),
    createdAt: row.createdAt
  };
}

export async function updateBoardElements(id: string, elements: BoardElement[]): Promise<void> {
  const pool = await dbConnect();
  await pool.request()
    .input('_id', sql.VarChar(50), id)
    .input('elements', sql.NVarChar(sql.MAX), JSON.stringify(elements))
    .query(`
      UPDATE Boards
      SET elements = @elements
      WHERE _id = @_id
    `);
}

export async function addEditor(id: string, editorId: string): Promise<void> {
  const board = await getBoardById(id);
  if (!board) return;
  
  const editors = new Set(board.editors);
  editors.add(editorId);
  const updatedEditors = Array.from(editors);

  const pool = await dbConnect();
  await pool.request()
    .input('_id', sql.VarChar(50), id)
    .input('editors', sql.NVarChar(sql.MAX), JSON.stringify(updatedEditors))
    .query(`
      UPDATE Boards
      SET editors = @editors
      WHERE _id = @_id
    `);
}

export async function deleteBoardById(id: string): Promise<void> {
  const pool = await dbConnect();
  await pool.request()
    .input('_id', sql.VarChar(50), id)
    .query(`
      DELETE FROM Boards
      WHERE _id = @_id
    `);
}

export async function lazyCleanupExpiredBoards(): Promise<void> {
  const pool = await dbConnect();
  await pool.request().query(`
    DELETE FROM Boards
    WHERE DATEDIFF(day, createdAt, GETDATE()) >= 3
  `);
}

const BoardFunctions = {
  createBoard,
  getBoardById,
  updateBoardElements,
  addEditor,
  deleteBoardById,
  initializeDatabase,
  lazyCleanupExpiredBoards
};

export default BoardFunctions;
