import { Router } from 'express';
import { respondResult, respondErrors } from '../utilities';
import pool from '../db-config';

const router = Router();

router.get('/', (req, res) => {
  res.send('Ok');
});

router.get('/query', async (req, res) => {
  try {
    const response = await pool.query(`
      SELECT * FROM FARM;
    `);
    respondResult(res)(response.rows);
  } catch (err) {
    respondErrors(res)(err);
  }
});

export default router;
