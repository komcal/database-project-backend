import pool from '../db-config';

export const getAllFarm = async () => {
  const res = await pool.query(`
    SELECT * FROM FARM;
  `);
  return res.rows;
};

export const getFarmByID = async (id) => {
  const res = await pool.query(`
    SELECT * FROM FARM 
    WHERE id = ${id};
  `);
  return res.rows;
};
