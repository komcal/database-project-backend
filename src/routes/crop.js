import { Router } from 'express';
import { respondResult, respondErrors } from '../utilities';
import { getCropByProvinceAndProduct } from '../models';

const router = Router();

router.get('/:province/:product', async (req, res) => {
  try {
    const response = await getCropByProvinceAndProduct(req.params.province, req.params.product);
    respondResult(res)(response);
  } catch (err) {
    respondErrors(res)(err);
  }
});

export default router;
