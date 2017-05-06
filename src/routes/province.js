import { Router } from 'express';
import { respondResult, respondErrors } from '../utilities';
import { getProvince } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const response = await getProvince();
    respondResult(res)(response);
  } catch (err) {
    respondErrors(res)(err);
  }
});

export default router;
