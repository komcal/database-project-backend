/* eslint-disable camelcase*/
import pool from '../db-config';

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

  const farmIdFromProduct = await pool.query(`
    SELECT DISTINCT id, name
    FROM farm
    WHERE EXISTS (
      SELECT *
      FROM farmproduct
      WHERE product_id = ${id}
        AND farm_id = farm.id
    )
    ORDER BY id ASC
  `);
  const farmIdToName = farmIdFromProduct.rows.reduce((sum, val) => {
    sum[val.id] = val.name.replace(/\s+$/, '');
    return sum;
  }, {});

  const timeFromProduct = await pool.query(`
    SELECT DISTINCT date_part('year' ,date) AS year,
                    date_part('month', date) AS month
                    ${type === 'week' ? ",date_part('day', date) AS special" : ''}
                    ${type === 'month' ? ",date_part('day',date_trunc('week', date)) AS special" : ''}
    FROM pricestamp
    JOIN DATE
      ON pricestamp.date_id = date.id
    WHERE farmproductid IN (
      SELECT id
      FROM farmproduct
      WHERE product_id = ${id}
    ) 
    ORDER BY year DESC, month DESC ${(type === 'week' || type === 'month') ? ', special DESC' : ''}
    fetch first ${t} rows only
  `);

  const avgFromProduct = await pool.query(`
    SELECT farm_id, AVG(price),
            date_part('year' ,date) AS year,
            date_part('month', date) AS month
            ${type === 'week' ? ",date_part('day', date) AS special" : ''}
            ${type === 'month' ? ",date_part('day',date_trunc('week', date)) AS special" : ''}
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

  const formatName = (data) => {
    if (type === 'month') {
      return `${data.special}-${data.special + 7}/${data.month}/${data.year}`;
    }
    return `${data.special ? `${data.special}/` : ''}${data.month}/${data.year}`;
  };

  const formattedData = timeFromProduct.rows.reduce((sum, row) => {
    const data = {
      name: formatName(row),
      type
    };
    const price = avgFromProduct.rows.filter(val => (val.year === row.year && val.month === row.month && val.special === row.special));
    price.forEach((val) => {
      data[farmIdToName[val.farm_id]] = parseFloat(val.avg.toFixed(2));
    });
    sum.push(data);
    return sum;
  }, []);

  return formattedData.reverse();
};

const getAvgOnFarmByProducOnTime = async (id, type) => {
  const t = ((x) => {
    switch (x) {
      case 'week': return 7;
      case 'month': return 30;
      case 'halfyear': return 180;
      case 'year': return 360;
      default: return 99999999;
    }
  })(type);
  const res = await pool.query(`
SELECT farm.id AS farm_id,avg(price.price) AS farm_avg_${type}
    FROM pricestamp
    JOIN farmproduct
      ON farmproduct.id = pricestamp.farmproductid
    JOIN price
      ON pricestamp.id = price_id
    JOIN farm
      ON farm.id = farmproduct.farm_id
    JOIN DATE
      ON date.id = pricestamp.date_id
    WHERE farmproduct.product_id = ${id}
    AND (
        SELECT MAX(DATE)
        FROM pricestamp
        JOIN farmproduct
        ON farmproduct.id = pricestamp.farmproductid
        JOIN DATE
        ON date.id = pricestamp.date_id
        WHERE farmproduct.product_id = ${id}
        ) - date.date < ${t}
    GROUP BY farm.id
  `);
  return res.rows;
};

const getAvgOnFarmByProduct = async (id) => {
  const farmIdFromProduct = await pool.query(`
    SELECT DISTINCT farm_id, name
    FROM farmproduct
    JOIN farm
      ON farm_id = farm.id
    WHERE product_id = ${id}
    ORDER BY farm_id ASC
  `);
  const result = farmIdFromProduct.rows.map(item => (
    {
      farm_id: item.farm_id,
      farm_name: item.name.replace(/\s+$/, '')
    }
  ));
  const byWeek = await getAvgOnFarmByProducOnTime(id, 'week');
  const byMonth = await getAvgOnFarmByProducOnTime(id, 'month');
  const byHYear = await getAvgOnFarmByProducOnTime(id, 'halfyear');
  const byYear = await getAvgOnFarmByProducOnTime(id, 'year');

  const res = result.map(item => ({
    ...item,
    farm_avg_week: parseFloat(byWeek.filter(x => (x.farm_id === item.farm_id))[0].farm_avg_week.toFixed(2)),
    farm_avg_month: parseFloat(byMonth.filter(x => (x.farm_id === item.farm_id))[0].farm_avg_month.toFixed(2)),
    farm_avg_halfyear: parseFloat(byHYear.filter(x => (x.farm_id === item.farm_id))[0].farm_avg_halfyear.toFixed(2)),
    farm_avg_year: parseFloat(byYear.filter(x => (x.farm_id === item.farm_id))[0].farm_avg_year.toFixed(2))
  }));
  return res;
};

export const getAvgByProduct = async (id) => {
  const byWeek = await newGetAvgByProductOnTime(id, 'week');
  const byMonth = await newGetAvgByProductOnTime(id, 'month');
  const byHYear = await newGetAvgByProductOnTime(id, 'halfyear');
  const byYear = await newGetAvgByProductOnTime(id, 'year');
  const farm = await getAvgOnFarmByProduct(id);
  return { data: [...byWeek, ...byMonth, ...byHYear, ...byYear].map((item, id) => ({ ...item, id })), farm };
};

export const getCoordinateAllProduct = async (id1, id2, type) => {
  const t = ((x) => {
    switch (x) {
      case 'week': return 7;
      case 'month': return 30;
      case 'halfyear': return 180;
      case 'year': return 360;
      default: return 99999999;
    }
  })(type);
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

    SELECT temp1.date_id AS id, temp1.avg AS x, temp2.avg AS y
    FROM temp AS temp1
    JOIN temp AS temp2
      ON temp1.date_id = temp2.date_id
    WHERE temp1.product_id = ${id1}
      AND temp2.product_id = ${id2}
    ORDER BY temp1.date_id DESC
    fetch first ${t} rows only
  `);
  return res.rows;
};

const getCorrAllProduct = async (id1, id2, type) => {
  const t = ((x) => {
    switch (x) {
      case 'week': return 7;
      case 'month': return 30;
      case 'halfyear': return 180;
      case 'year': return 360;
      default: return 99999999;
    }
  })(type);
  const res = await pool.query(`
  SELECT corr(x,y) FROM(
    SELECT T1.avg AS x, T2.avg AS y
    FROM (
      SELECT date_id,farmproduct.product_id, avg(price) AS AVG
      FROM pricestamp
      JOIN price 
        ON pricestamp.id = price_id
      JOIN farmproduct
        ON pricestamp.farmproductid = farmproduct.id
      GROUP BY date_id, farmproduct.product_id 
      ) AS T1
    JOIN (
      SELECT date_id,farmproduct.product_id, avg(price) AS AVG
      FROM pricestamp
      JOIN price 
        ON pricestamp.id = price_id
      JOIN farmproduct
        ON pricestamp.farmproductid = farmproduct.id
      GROUP BY date_id, farmproduct.product_id  
      ) AS T2
    ON T2.date_id = T1.date_id
    WHERE T1.product_id = ${id1}
      AND T2.product_id = ${id2}
    ORDER BY T1.date_id DESC
    fetch first ${t} rows only
  ) AS T
`);
  return parseFloat((res.rows[0].corr || 0).toFixed(2));
};

export const getCorrByProduct = async (id1, id2) => {
  const dataWeek = await getCoordinateAllProduct(id1, id2, 'week');
  const dataMonth = await getCoordinateAllProduct(id1, id2, 'month');
  const dataHYear = await getCoordinateAllProduct(id1, id2, 'halfyear');
  const dataYear = await getCoordinateAllProduct(id1, id2, 'year');

  const data = [...dataWeek.map(x => ({ ...x, type: 'week' })), ...dataMonth.map(x => ({ ...x, type: 'month' })), ...dataHYear.map(x => ({ ...x, type: 'halfyear' })), ...dataYear.map(x => ({ ...x, type: 'year' }))];
  const corr_week = await getCorrAllProduct(id1, id2, 'week');
  const corr_month = await getCorrAllProduct(id1, id2, 'month');
  const corr_halfyear = await getCorrAllProduct(id1, id2, 'halfyear');
  const corr_year = await getCorrAllProduct(id1, id2, 'year');

  const corr = {
    corr_week,
    corr_month,
    corr_halfyear,
    corr_year
  };

  return { data, corr };
};
