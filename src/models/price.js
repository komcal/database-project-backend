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

const getAvgByProductOnTime = async (id, type) => {
  const typeFormatConvert = (valuetype, value) => {
    if (valuetype === 'week') {
      return `week ${value},`;
    }
    switch (value) {
      case 1: return 'JAN';
      case 2: return 'FEB';
      case 3: return 'MAR';
      case 4: return 'APR';
      case 5: return 'MAY';
      case 6: return 'JUN';
      case 7: return 'JUL';
      case 8: return 'AUG';
      case 9: return 'SEP';
      case 10: return 'OCT';
      case 11: return 'NOV';
      case 12: return 'DEC';
      default: return 'YEAR';
    }
  };

  const farmIdFromProduct = await pool.query(`
    SELECT DISTINCT farm_id, name
    FROM farmproduct
    JOIN farm
      ON farm_id = farm.id
    WHERE product_id = ${id}
    ORDER BY farm_id ASC
  `);

  const farmIdToName = farmIdFromProduct.rows.reduce((sum, val) => {
    sum[val.farm_id] = val.name.replace(/\s+$/, '');
    return sum;
  }, {});

  const timeFromProduct = await pool.query(`
    SELECT DISTINCT date_part('year' ,date) AS year,
                    date_part('${type}', date) AS ${type}
    FROM pricestamp
    JOIN farmproduct
      ON farmproduct.id = farmproductid
    JOIN DATE
      ON pricestamp.date_id = date.id
    WHERE product_id = ${id}
    ORDER BY year ASC, ${type} ASC
  `);

  const avgFromProduct = await pool.query(`
    SELECT farm_id, AVG(price), date_part('${type}' ,date) AS YEAR, date_part('${type}', date) AS ${type}
    FROM price
    JOIN pricestamp
      ON price.price_id = pricestamp.id
    JOIN farmproduct
      ON farmproduct.id = farmproductid
    JOIN DATE
      ON pricestamp.date_id = date.id
    WHERE product_id = ${id}
    GROUP BY farm_id,product_id, year, ${type}
    ORDER BY farm_id ASC, YEAR ASC, ${type} ASC
  `);

  const formattedData = timeFromProduct.rows.reduce((sum, row) => {
    const data = {
      time: `${typeFormatConvert(type, row[type])} ${row.year}`,
      type
    };
    const price = avgFromProduct.rows.filter(val => (val.year === row.year && val[type] === row[type]));
    price.forEach((val) => {
      data[farmIdToName[val.farm_id]] = val.avg;
    });
    sum.push(data);
    return sum;
  }, []);

  return formattedData;
};

export const getAvgByProduct = async (id) => {
  const byWeek = await getAvgByProductOnTime(id, 'week');
  const byMonth = await getAvgByProductOnTime(id, 'month');

  return [...byWeek, ...byMonth];
};
