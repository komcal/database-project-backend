import pool from '../db-config';

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
    SELECT farm_id, AVG(price), date_part('year' ,date) AS year, date_part('${type}', date) AS ${type}
    FROM price
    JOIN pricestamp
      ON price.price_id = pricestamp.id
    JOIN farmproduct
      ON farmproduct.id = farmproductid
    JOIN DATE
      ON pricestamp.date_id = date.id
    WHERE product_id = ${id}
    GROUP BY farm_id,product_id, year, ${type}
    ORDER BY farm_id ASC, year ASC, ${type} ASC
  `);

  const formattedData = timeFromProduct.rows.reduce((sum, row) => {
    const data = {
      name: `${typeFormatConvert(type, row[type])} ${row.year}`,
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

const newGetAvgByProductOnTime = async (id, type) => {
  const t = ((x) => {
    switch (x) {
      case 'week': return 7;
      case 'month': return 4;
      case 'halfyear': return 6;
      case 'year': return 12;
      default: return 99999999;
    }
  })(type);

  const swtype = ((x) => {
    switch (x) {
      case 'week': return 'day';
      case 'month': return 'week';
      default: return '';
    }
  })(type);

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
                    date_part('month', date) AS month
                    ${(type === 'week' || type === 'month') ? `,date_part('${swtype}', date) AS special` : ''}
    FROM pricestamp
    JOIN farmproduct
      ON farmproduct.id = farmproductid
    JOIN DATE
      ON pricestamp.date_id = date.id
    WHERE product_id = ${id}
    ORDER BY year DESC, month DESC ${(type === 'week' || type === 'month') ? ', special DESC' : ''}
    fetch first ${t} rows only
  `);

  console.log('1st');

  const avgFromProduct = await pool.query(`
    SELECT farm_id, AVG(price),
            date_part('year' ,date) AS year,
            date_part('month', date) AS month
            ${(type === 'week' || type === 'month') ? `,date_part('${swtype}', date) AS special` : ''}
    FROM price
    JOIN pricestamp
      ON price.price_id = pricestamp.id
    JOIN farmproduct
      ON farmproduct.id = farmproductid
    JOIN DATE
      ON pricestamp.date_id = date.id
    WHERE product_id = ${id}
    GROUP BY farm_id,product_id, year, month ${(type === 'week' || type === 'month') ? ', special' : ''}
    ORDER BY year DESC, month DESC ${(type === 'week' || type === 'month') ? ', special DESC' : ''}, farm_id ASC
    fetch first ${t * farmIdFromProduct.rows.length} rows only
  `);
  console.log('2nd');

  const formattedData = timeFromProduct.rows.reduce((sum, row) => {
    const data = {
      name: `${row.special ? `${swtype === 'week' ? 'week' : ''}${row.special}${swtype === 'week' ? ' month ' : '/'}` : ''}${row.month}/${row.year}`,
      type
    };
    const price = avgFromProduct.rows.filter(val => (val.year === row.year && val.month === row.month && val.special === row.special));
    price.forEach((val) => {
      data[farmIdToName[val.farm_id]] = val.avg;
    });
    sum.push(data);
    return sum;
  }, []);

  return formattedData.reverse();
};


const getAvgOnFarmByProduct = async (id) => {
  const res = await pool.query(`
    SELECT farm.id AS farm_id, farm.name AS farm_name, avg(price.price) AS farm_avg
    FROM pricestamp
    JOIN farmproduct
      ON farmproduct.id = pricestamp.farmproductid
    JOIN price
      ON pricestamp.id = price_id
    JOIN farm
      ON farm.id = farmproduct.farm_id
    WHERE farmproduct.product_id = ${id}
    GROUP BY farm.id`
  );
  return res.rows.map(item => ({ ...item, farm_name: item.farm_name.replace(/\s+$/, '') }));
};

export const getAvgByProduct = async (id) => {
  const byWeek = await newGetAvgByProductOnTime(id, 'week');
  const byMonth = await newGetAvgByProductOnTime(id, 'month');
  const byHYear = await newGetAvgByProductOnTime(id, 'halfyear');
  console.log(byHYear);
  const byYear = await newGetAvgByProductOnTime(id, 'year');
  const farm = await getAvgOnFarmByProduct(id);
  return { data: [...byWeek, ...byMonth, ...byHYear, ...byYear].map((item, id) => ({ ...item, id })), farm };
};

export const getOldCorrAllProduct = async (id1, id2) => {
  const avg1 = await pool.query(`
    SELECT date_id, AVG(price) AS avg
    FROM pricestamp
    JOIN price
      ON price.price_id = pricestamp.id
    JOIN farmproduct
      ON pricestamp.farmproductid = farmproduct.id
    WHERE date_id IN (
      SELECT DISTINCT T1.date_id
      FROM pricestamp AS T1
      JOIN pricestamp AS T2
        ON T1.date_id = T2.date_id
      JOIN farmproduct AS T3
        ON T1.farmproductid = T3.id
      JOIN farmproduct AS T4
        ON T2.farmproductid = T4.id
      WHERE T3.product_id = ${id1}
        AND T4.product_id = ${id2}
    )
      AND product_id = ${id1}
    GROUP BY date_id
    ORDER BY date_id ASC`);

  const avg2 = await pool.query(`
    SELECT date_id, AVG(price) AS avg
    FROM pricestamp
    JOIN price
      ON price.price_id = pricestamp.id
    JOIN farmproduct
      ON pricestamp.farmproductid = farmproduct.id
    WHERE date_id IN (
      SELECT DISTINCT T1.date_id
      FROM pricestamp AS T1
      JOIN pricestamp AS T2
        ON T1.date_id = T2.date_id
      JOIN farmproduct AS T3
        ON T1.farmproductid = T3.id
      JOIN farmproduct AS T4
        ON T2.farmproductid = T4.id
      WHERE T3.product_id = ${id1}
        AND T4.product_id = ${id2}
    )
      AND product_id = ${id2}
    GROUP BY date_id
    ORDER BY date_id ASC`);

  const data = [];
  for (let i = 0; i < avg2.rows.length; i += 1) {
    data.push({
      id: avg2.rows[i].date_id,
      price1: avg1.rows[i].avg,
      price2: avg2.rows[i].avg
    });
  }
  return data;
};
export const getCoordinateAllProduct = async (id1, id2) => {
  const res = await pool.query(`
    WITH temp AS (
      SELECT date_id, AVG(price), product_id
      FROM pricestamp
      JOIN price
        ON price.price_id = pricestamp.id
      JOIN farmproduct
        ON pricestamp.farmproductid = farmproduct.id
      WHERE date_id IN (
          SELECT DISTINCT T1.date_id
          FROM pricestamp AS T1
          JOIN pricestamp AS T2
            ON T1.date_id = T2.date_id
          JOIN farmproduct AS T3
            ON T1.farmproductid = T3.id
          JOIN farmproduct AS T4
            ON T2.farmproductid = T4.id
          WHERE T3.product_id = ${id1}
            AND T4.product_id = ${id2}
      )
      GROUP BY date_id,product_id
    )

    SELECT temp1.date_id AS id, temp1.avg AS avg1, temp2.avg AS avg2
    FROM temp AS temp1
    JOIN temp AS temp2
      ON temp1.date_id = temp2.date_id
    WHERE temp1.product_id = ${id1}
      AND temp2.product_id = ${id2}
    ORDER BY temp1.date_id ASC
  `);
  return res.rows;
};

const getCorrAllProduct = async (id1, id2) => {
  const res = await pool.query(`
    WITH temp AS (
      SELECT date_id, AVG(price), product_id
      FROM pricestamp
      JOIN price
        ON price.price_id = pricestamp.id
      JOIN farmproduct
        ON pricestamp.farmproductid = farmproduct.id
      WHERE date_id IN (
          SELECT DISTINCT T1.date_id
          FROM pricestamp AS T1
          JOIN pricestamp AS T2
            ON T1.date_id = T2.date_id
          JOIN farmproduct AS T3
            ON T1.farmproductid = T3.id
          JOIN farmproduct AS T4
            ON T2.farmproductid = T4.id
          WHERE T3.product_id = ${id1}
            AND T4.product_id = ${id2}
      )
      GROUP BY date_id,product_id
    )

    SELECT corr(p1.avg, p2.avg) AS corr
    FROM temp AS temp1
    JOIN temp AS temp2
      ON temp1.date_id = temp2.date_id
    WHERE temp1.product_id = ${id1}
      AND temp2.product_id = ${id2}
  `);
  return res.rows[0].corr;
};

export const getCorrByProduct = async (id1, id2) => {
  const data = await getCoordinateAllProduct(id1, id2);
  const corr = await getCorrAllProduct(id1, id2);
  return { data, corr };
};
