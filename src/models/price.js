import pool from '../db-config';

export const getAllPrice = async () => {
  const res = await pool.query(`
    SELECT * FROM PRICE;
  `);
  return res.rows;
};

export const getPriceByProduct = async (id) => {
  const farmFromProduct = await pool.query(`
    SELECT DISTINCT PRICE.farm_id, name FROM PRICE
    JOIN FARM
    ON FARM.id = PRICE.farm_id
    WHERE product_id = ${id}
    ORDER BY farm_id ASC;
  `);
  const dateFromProduct = await pool.query(`
    SELECT DISTINCT PRICE.date FROM PRICE
    WHERE product_id = ${id}
    ORDER BY PRICE.date ASC
  `);
  const priceFromProduct = await pool.query(`
    SELECT DISTINCT T1.farm_id, T2.date, T3.price FROM PRICE AS T1
    CROSS JOIN PRICE AS T2
    LEFT JOIN PRICE AS T3
    ON T3.farm_id = T1.farm_id AND T2.date = T3.date
    WHERE T1.product_id = ${id} AND T2.product_id = ${id}
    ORDER BY T1.farm_id ASC, T2.date ASC;
  `);
  const res = {
    duration: dateFromProduct.rows.map(d => (d.date)),
    farms: farmFromProduct.rows.map(farm => ({
      farmName: farm.name,
      price: priceFromProduct.rows.filter(p => (p.farm_id === farm.farm_id)).map(p => (p.price))
    }))
  };
  return res;
};
