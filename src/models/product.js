import pool from '../db-config';

export const getProduct = async () => {
  const res = await pool.query(`
    SELECT id, name
    FROM product
  `);
  return res.rows;
};
