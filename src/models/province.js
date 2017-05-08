import pool from '../db-config';

export const getProvince = async () => {
  const res = await pool.query(`
    SELECT *
    FROM province
  `);
  return res.rows.map(data => (
     { ...data, name: data.name.replace(/\s+$/, '') }
  ));
};
