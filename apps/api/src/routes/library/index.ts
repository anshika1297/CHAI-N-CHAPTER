import { Router } from 'express';
import booksRoutes from './books.js';
import authorsRoutes from './authors.js';
import taxonomyRoutes from './taxonomy.js';
import statsRoutes from './stats.js';
import importRoutes from './import.js';
import queryRoutes from './query.js';
import recommendRoutes from './recommend.js';
import contentRoutes from './content.js';
import exportRoutes from './export.js';
import analyticsRoutes from './analytics.js';
import collectionsRoutes from './collections.js';

/** Internal Library OS module — all sub-routes are admin-only (enforced per sub-router). */
const router = Router();

router.use('/books', booksRoutes);
router.use('/authors', authorsRoutes);
router.use('/taxonomy', taxonomyRoutes);
router.use('/collections', collectionsRoutes);
router.use('/stats', statsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/import', importRoutes);
router.use('/query', queryRoutes);
router.use('/recommend', recommendRoutes);
router.use('/content', contentRoutes);
router.use('/export', exportRoutes);

export default router;
