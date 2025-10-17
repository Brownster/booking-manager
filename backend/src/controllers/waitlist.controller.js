import {
  createEntry,
  listEntries,
  getEntry,
  updateEntry,
  promoteEntry,
  cancelEntry,
  removeEntry
} from '../services/waitlist.service.js';

export const listWaitlist = async (req, res, next) => {
  try {
    const { status, providerUserId, priority } = req.query;
    const entries = await listEntries({
      tenantId: req.user.tenantId,
      status,
      providerUserId,
      priority
    });
    res.status(200).json({ entries });
  } catch (error) {
    next(error);
  }
};

export const createWaitlist = async (req, res, next) => {
  try {
    const entry = await createEntry({
      tenantId: req.user.tenantId,
      ...req.body
    });
    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
};

export const getWaitlist = async (req, res, next) => {
  try {
    const entry = await getEntry(req.user.tenantId, req.params.entryId);
    res.status(200).json({ entry });
  } catch (error) {
    next(error);
  }
};

export const updateWaitlist = async (req, res, next) => {
  try {
    const entry = await updateEntry(req.user.tenantId, req.params.entryId, req.body);
    res.status(200).json({ entry });
  } catch (error) {
    next(error);
  }
};

export const promoteWaitlist = async (req, res, next) => {
  try {
    const entry = await promoteEntry(req.user.tenantId, req.params.entryId);
    res.status(200).json({ entry });
  } catch (error) {
    next(error);
  }
};

export const cancelWaitlist = async (req, res, next) => {
  try {
    const entry = await cancelEntry(req.user.tenantId, req.params.entryId, req.body ?? {});
    res.status(200).json({ entry });
  } catch (error) {
    next(error);
  }
};

export const deleteWaitlist = async (req, res, next) => {
  try {
    await removeEntry(req.user.tenantId, req.params.entryId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
