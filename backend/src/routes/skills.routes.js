import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import {
  createSkill,
  listSkills,
  updateSkill,
  deleteSkill
} from '../controllers/skill.controller.js';
import {
  createSkillValidation,
  listSkillsValidation,
  updateSkillValidation,
  deleteSkillValidation
} from '../validators/skill.validators.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions(['skills:read'], { legacyRoles: ['admin', 'provider', 'user'] }),
  listSkillsValidation,
  listSkills
);
router.post(
  '/',
  requirePermissions(['skills:create'], { legacyRoles: ['admin'] }),
  createSkillValidation,
  createSkill
);
router.put(
  '/:skillId',
  requirePermissions(['skills:update'], { legacyRoles: ['admin'] }),
  updateSkillValidation,
  updateSkill
);
router.delete(
  '/:skillId',
  requirePermissions(['skills:delete'], { legacyRoles: ['admin'] }),
  deleteSkillValidation,
  deleteSkill
);

export default router;
