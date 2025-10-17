import {
  createSkillForTenant,
  listSkillsForTenant,
  updateSkillForTenant,
  removeSkillForTenant
} from '../services/skill.service.js';

export const createSkill = async (req, res, next) => {
  try {
    const { name, category, description } = req.body;
    const skill = await createSkillForTenant({
      tenantId: req.user.tenantId,
      name,
      category,
      description
    });
    res.status(201).json({ skill });
  } catch (error) {
    next(error);
  }
};

export const listSkills = async (req, res, next) => {
  try {
    const { search, limit, offset } = req.query;
    const skills = await listSkillsForTenant(req.user.tenantId, {
      search,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.status(200).json({ skills });
  } catch (error) {
    next(error);
  }
};

export const updateSkill = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.description !== undefined) updates.description = req.body.description;
    const skill = await updateSkillForTenant(req.user.tenantId, skillId, updates);
    res.status(200).json({ skill });
  } catch (error) {
    next(error);
  }
};

export const deleteSkill = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    await removeSkillForTenant(req.user.tenantId, skillId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
