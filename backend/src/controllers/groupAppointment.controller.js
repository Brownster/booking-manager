import {
  createGroupAppointment,
  listGroupAppointmentSummaries,
  getGroupAppointment,
  updateGroupAppointmentDetails,
  cancelGroupAppointment,
  respondAsProvider,
  respondAsParticipant,
  deleteGroupAppointmentRecord
} from '../services/groupAppointment.service.js';

export const createGroupAppointmentController = async (req, res, next) => {
  try {
    const appointment = await createGroupAppointment({
      tenantId: req.user.tenantId,
      name: req.body.name,
      description: req.body.description,
      startTime: req.body.start_time,
      endTime: req.body.end_time,
      durationMinutes: req.body.duration_minutes,
      maxParticipants: req.body.max_participants,
      providers: req.body.providers,
      participants: req.body.participants,
      createdBy: req.user.id,
      metadata: req.body.metadata
    });
    res.status(201).json({ groupAppointment: appointment });
  } catch (error) {
    next(error);
  }
};

export const listGroupAppointmentsController = async (req, res, next) => {
  try {
    const appointments = await listGroupAppointmentSummaries({
      tenantId: req.user.tenantId,
      status: req.query.status,
      providerUserId: req.query.providerUserId,
      participantUserId: req.query.participantUserId
    });
    res.status(200).json({ groupAppointments: appointments });
  } catch (error) {
    next(error);
  }
};

export const getGroupAppointmentController = async (req, res, next) => {
  try {
    const appointment = await getGroupAppointment(req.user.tenantId, req.params.groupAppointmentId);
    res.status(200).json({ groupAppointment: appointment });
  } catch (error) {
    next(error);
  }
};

export const updateGroupAppointmentController = async (req, res, next) => {
  try {
    const appointment = await updateGroupAppointmentDetails(req.user.tenantId, req.params.groupAppointmentId, req.body);
    res.status(200).json({ groupAppointment: appointment });
  } catch (error) {
    next(error);
  }
};

export const cancelGroupAppointmentController = async (req, res, next) => {
  try {
    const appointment = await cancelGroupAppointment(req.user.tenantId, req.params.groupAppointmentId);
    res.status(200).json({ groupAppointment: appointment });
  } catch (error) {
    next(error);
  }
};

export const respondProviderController = async (req, res, next) => {
  try {
    const appointment = await respondAsProvider({
      tenantId: req.user.tenantId,
      appointmentId: req.params.groupAppointmentId,
      providerUserId: req.params.providerUserId,
      status: req.body.status
    });
    res.status(200).json({ groupAppointment: appointment });
  } catch (error) {
    next(error);
  }
};

export const respondParticipantController = async (req, res, next) => {
  try {
    const appointment = await respondAsParticipant({
      tenantId: req.user.tenantId,
      appointmentId: req.params.groupAppointmentId,
      participantUserId: req.params.participantUserId,
      status: req.body.status,
      metadata: req.body.metadata
    });
    res.status(200).json({ groupAppointment: appointment });
  } catch (error) {
    next(error);
  }
};

export const deleteGroupAppointmentController = async (req, res, next) => {
  try {
    await deleteGroupAppointmentRecord(req.user.tenantId, req.params.groupAppointmentId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
