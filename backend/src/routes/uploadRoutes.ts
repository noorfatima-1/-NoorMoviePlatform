import { Router } from 'express';
import { uploadFile, deleteFile } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, uploadFile);
router.delete('/', authenticate, deleteFile);

export default router;
