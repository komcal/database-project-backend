import { Router } from 'express';
import sample from './sample';
import farm from './farm';
import price from './price';
import product from './product';

const router = Router();
router.use('/sample', sample);
router.use('/farms', farm);
router.use('/price', price);
router.use('/product', product);

export default router;
