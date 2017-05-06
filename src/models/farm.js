import pool from '../db-config';

export const getAllFarm = async () => {
  const res = await pool.query(`
    SELECT * FROM FARM;
  `);
  return res.rows;
};

export const getFarmByID = async (id) => {
  const res = await pool.query(`
    SELECT name, product_id, date, price FROM PRICE
    INNER JOIN FARM
    ON FARM.id = PRICE.farm_id
    WHERE farm_id = ${id};
  `);
  return res.rows;
};

export const getProduct = async () => {
  const res = await pool.query(`
    SELECT id, name
    FROM product
  `);
  return res.rows;
};
