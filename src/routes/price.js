import { Router } from 'express';
import { respondResult, respondErrors } from '../utilities';
import { getAllPrice, getPriceByProduct } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const response = await getAllPrice();
    respondResult(res)(response);
  } catch (err) {
    respondErrors(res)(err);
  }
});

router.get('/product-:id', async (req, res) => {
  try {
    const response = await getPriceByProduct(req.params.id);
    respondResult(res)(response);
  } catch (err) {
    respondErrors(res)(err);
  }
});

export default router;
