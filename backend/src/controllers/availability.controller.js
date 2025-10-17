import {
  createSlotForCalendar,
  listSlotsForCalendar,
  updateSlotForCalendar,
  deleteSlotForCalendar,
  searchAvailability
} from '../services/availability.service.js';

export const listSlots = async (req, res, next) => {
  try {
    const slots = await listSlotsForCalendar(req.user.tenantId, req.params.calendarId);
    res.status(200).json({ slots });
  } catch (error) {
    next(error);
  }
};

export const createSlot = async (req, res, next) => {
  try {
    const { calendarId } = req.params;
    const slot = await createSlotForCalendar(req.user.tenantId, calendarId, req.body);
    res.status(201).json({ slot });
  } catch (error) {
    next(error);
  }
};

export const updateSlot = async (req, res, next) => {
  try {
    const { calendarId, slotId } = req.params;
    const slot = await updateSlotForCalendar(req.user.tenantId, calendarId, slotId, req.body);
    res.status(200).json({ slot });
  } catch (error) {
    next(error);
  }
};

export const deleteSlot = async (req, res, next) => {
  try {
    const { calendarId, slotId } = req.params;
    await deleteSlotForCalendar(req.user.tenantId, calendarId, slotId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const searchAvailabilityController = async (req, res, next) => {
  try {
    const results = await searchAvailability({
      tenantId: req.user.tenantId,
      skillIds: req.body.skillIds,
      start: req.body.start,
      end: req.body.end,
      duration: req.body.duration,
      timezone: req.body.timezone
    });
    res.status(200).json({ availability: results });
  } catch (error) {
    next(error);
  }
};
