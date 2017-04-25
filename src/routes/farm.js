import { Router } from 'express';
import { respondResult, respondErrors } from '../utilities';
import { getAllFarm, getFarmByID } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const response = await getAllFarm();
    respondResult(res)(response);
  } catch (err) {
    respondErrors(res)(err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const response = await getFarmByID(req.params.id);
    respondResult(res)(response);
  } catch (err) {
    respondErrors(res)(err);
  }
});

export default router;
