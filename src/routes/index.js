import { Router } from 'express';
import sample from './sample';
import farm from './farm';
import price from './price';

const router = Router();
router.use('/sample', sample);
router.use('/farms', farm);
router.use('/price', price);

export default router;
