import pool from '../db-config';

export const getAllFarm = async () => {
  const res = await pool.query(`
    SELECT * FROM FARM;
  `);
  return res.rows;
};
