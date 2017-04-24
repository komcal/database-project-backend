import { Router } from 'express';
import { respondResult, respondErrors } from '../utilities';
import { getAllFarm } from '../models';

const router = Router();

router.get('/', (req, res) => {
  res.send('Ok');
});

router.get('/query', async (req, res) => {
  try {
    const response = await getAllFarm();
    respondResult(res)(response);
  } catch (err) {
    respondErrors(res)(err);
  }
});

export default router;
