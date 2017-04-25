import pool from '../db-config';

export const getAllPrice = async () => {
  const res = await pool.query(`
    SELECT * FROM PRICE;
  `);
  return res.rows;
};
