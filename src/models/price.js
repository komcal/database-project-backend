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

export const getAvgByProduct = async (id) => {
  const farmIdFromProduct = await pool.query(`
    SELECT DISTINCT farm_id, name
    FROM price
    JOIN pricestamp
      ON price.price_id = pricestamp.id
    JOIN farmproduct
      ON farmproduct.id = farmproductid
    JOIN farm
      ON farm_id = farm.id
    WHERE product_id = ${id}
    ORDER BY farm_id ASC
  `);
  const farmIdToName = farmIdFromProduct.rows.reduce((sum, val) => {
    sum[val.farm_id] = val.name.replace(/\s+$/, '');
    return sum;
  }, {});
  const monthFromProduct = await pool.query(`
    SELECT DISTINCT date_part('year' ,pricestamp.date) AS year, date_part('month', pricestamp.date) AS month
    FROM price
    JOIN pricestamp
      ON price.price_id = pricestamp.id
    JOIN farmproduct
      ON farmproduct.id = farmproductid
    WHERE product_id = ${id}
    ORDER BY year ASC, month ASC
  `);
  const avgFromProduct = await pool.query(`
    SELECT farm_id, AVG(price) AS avg , date_part('year' ,pricestamp.date) AS year, date_part('month', pricestamp.date) AS month
    FROM price
    JOIN pricestamp
      ON price.price_id = pricestamp.id
    JOIN farmproduct
      ON farmproduct.id = farmproductid
    WHERE product_id = ${id}
    GROUP BY farm_id,product_id, year, month
    ORDER BY farm_id ASC, year ASC, month ASC
  `);
  const formattedData = monthFromProduct.rows.reduce((sum, row) => {
    const data = {
      time: `${row.year} ${row.month}`
    };
    const price = avgFromProduct.rows.filter(val => (val.year === row.year && val.month === row.month));
    price.forEach((val) => {
      data[farmIdToName[val.farm_id]] = val.avg;
    });
    sum.push(data);
    return sum;
  }, []);
  return formattedData;
};
