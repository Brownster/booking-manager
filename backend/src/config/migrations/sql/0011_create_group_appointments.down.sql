DROP TRIGGER IF EXISTS set_group_appointment_participants_updated_at ON group_appointment_participants;
DROP TRIGGER IF EXISTS set_group_appointment_providers_updated_at ON group_appointment_providers;
DROP TRIGGER IF EXISTS set_group_appointments_updated_at ON group_appointments;

DROP TABLE IF EXISTS group_appointment_participants;
DROP TABLE IF EXISTS group_appointment_providers;
DROP TABLE IF EXISTS group_appointments;
