import { Router } from 'express';
import sample from './sample';
import farm from './farm';

const router = Router();
router.use('/sample', sample);
router.use('/farms', farm);

export default router;
