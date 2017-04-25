import pool from '../db-config';

export const getAllPrice = async () => {
  const res = await pool.query(`
    SELECT * FROM PRICE;
  `);
  return res.rows;
};

export const getPriceByProduct = async (id) => {
  const res = await pool.query(`
    SELECT * FROM PRICE
    WHERE product_id = ${id};
  `);
  return res.rows;
};
