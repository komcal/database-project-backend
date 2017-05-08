import pool from '../db-config';

export const getCropByProvinceAndProduct = async (province, product) => {
  const data = await pool.query(`
    SELECT sum(plantarea) AS sum_plantarea, sum(harvestarea) AS sum_harvestarea, sum(goods) AS sum_goods, year
    FROM cropindistrict
    WHERE product_id = ${product}
      AND district_id IN (
        SELECT id
        FROM district
        WHERE province_id = ${province}
      )
    GROUP BY year
  `);
  console.log(data.rows);
  return data.rows.map(d => (
    {
      year: parseInt(d.year, 10),
      plantarea: parseFloat(d.sum_plantarea),
      harvestarea: parseFloat(d.sum_harvestarea),
      goods: parseFloat(d.sum_goods)
    }));
};
