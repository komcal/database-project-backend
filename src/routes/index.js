import { Router } from 'express';
import sample from './sample';
import farm from './farm';
import price from './price';
import product from './product';
import province from './province';
import crop from './crop';

const router = Router();
router.use('/sample', sample);
router.use('/farms', farm);
router.use('/price', price);
router.use('/product', product);
router.use('/province', province);
router.use('/crop', crop);

export default router;
