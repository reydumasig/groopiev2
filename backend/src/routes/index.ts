import { Router } from 'express';
import userRoutes from './user.routes';
import groupRoutes from './group.routes';
import subscriptionRoutes from './subscription.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/admin', adminRoutes);

export default router; 