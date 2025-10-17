import {
  createAppointmentForTenant,
  listAppointments,
  updateAppointmentForTenant,
  cancelAppointmentForTenant,
  deleteAppointmentForTenant
} from '../services/appointment.service.js';
import { getAppointmentById } from '../repositories/appointment.repository.js';

export const createAppointment = async (req, res, next) => {
  try {
    const appointment = await createAppointmentForTenant({
      tenantId: req.user.tenantId,
      calendarId: req.body.calendarId,
      clientUserId: req.body.clientUserId,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      requiredSkills: req.body.requiredSkills,
      notes: req.body.notes,
      metadata: req.body.metadata
    });
    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
};

export const listAppointmentsController = async (req, res, next) => {
  try {
    const appointments = await listAppointments({
      tenantId: req.user.tenantId,
      calendarId: req.query.calendarId,
      start: req.query.start,
      end: req.query.end
    });
    res.status(200).json({ appointments });
  } catch (error) {
    next(error);
  }
};

export const getAppointment = async (req, res, next) => {
  try {
    const appointment = await getAppointmentById(req.user.tenantId, req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: { message: 'Appointment not found', status: 404 } });
    }
    res.status(200).json({ appointment });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentController = async (req, res, next) => {
  try {
    const appointment = await updateAppointmentForTenant({
      tenantId: req.user.tenantId,
      appointmentId: req.params.appointmentId,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      status: req.body.status,
      notes: req.body.notes,
      metadata: req.body.metadata
    });
    res.status(200).json({ appointment });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointmentController = async (req, res, next) => {
  try {
    const appointment = await cancelAppointmentForTenant(req.user.tenantId, req.params.appointmentId);
    res.status(200).json({ appointment });
  } catch (error) {
    next(error);
  }
};

export const deleteAppointmentController = async (req, res, next) => {
  try {
    await deleteAppointmentForTenant(req.user.tenantId, req.params.appointmentId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
