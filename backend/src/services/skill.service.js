import { ApiError } from '../utils/error.js';
import {
  createSkill,
  getSkillById,
  getSkillByName,
  listSkills,
  updateSkill,
  deleteSkill
} from '../repositories/skill.repository.js';
import { ensureTenantExists } from '../repositories/tenant.repository.js';

export const createSkillForTenant = async ({ tenantId, name, category, description }) => {
  await ensureTenantExists(tenantId);
  const existing = await getSkillByName(tenantId, name);
  if (existing) {
    throw new ApiError(409, 'Skill name already exists for tenant');
  }
  return createSkill({ tenantId, name, category, description });
};

export const listSkillsForTenant = (tenantId, options) => listSkills(tenantId, options);

export const updateSkillForTenant = async (tenantId, skillId, payload) => {
  const skill = await getSkillById(tenantId, skillId);
  if (!skill) {
    throw new ApiError(404, 'Skill not found');
  }

  if (payload.name && payload.name !== skill.name) {
    const duplicate = await getSkillByName(tenantId, payload.name);
    if (duplicate) {
      throw new ApiError(409, 'Skill name already exists for tenant');
    }
  }

  return updateSkill(tenantId, skillId, payload);
};

export const removeSkillForTenant = async (tenantId, skillId) => {
  const deleted = await deleteSkill(tenantId, skillId);
  if (!deleted) {
    throw new ApiError(404, 'Skill not found');
  }
  return deleted;
};
