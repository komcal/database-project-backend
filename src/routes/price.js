import { Router } from 'express';
import { respondResult, respondErrors } from '../utilities';
import { getAvgByProduct, getCorrByProduct } from '../models';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const response = await getAvgByProduct(req.params.id);
    respondResult(res)(response);
  } catch (err) {
    respondErrors(res)(err);
  }
});

router.get('/corr/:id1.:id2', async (req, res) => {
  try {
    const response = await getCorrByProduct(req.params.id1, req.params.id2);
    respondResult(res)(response);
  } catch (err) {
    respondErrors(res)(err);
  }
});

export default router;
