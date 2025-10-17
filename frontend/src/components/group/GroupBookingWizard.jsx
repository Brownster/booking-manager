import { useEffect, useMemo, useState } from 'react';
import { addMinutes } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import Button from '../ui/Button.jsx';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal.jsx';
import StepIndicator from './StepIndicator.jsx';
import SessionDetailsStep from './steps/SessionDetailsStep.jsx';
import ProviderSelectionStep from './steps/ProviderSelectionStep.jsx';
import ParticipantStep from './steps/ParticipantStep.jsx';
import ReviewStep from './steps/ReviewStep.jsx';
import './group.css';

const steps = [
  { id: 'details', title: 'Session Details' },
  { id: 'providers', title: 'Select Providers' },
  { id: 'participants', title: 'Add Participants' },
  { id: 'review', title: 'Review & Confirm' }
];

const initialState = {
  name: '',
  description: '',
  duration: 60,
  startDate: '',
  startTime: '09:00',
  timezone: 'America/New_York',
  providerIds: [],
  participantIds: [],
  notes: ''
};

const getDefaultLookup = (items) =>
  Object.fromEntries(items.map((item) => [item.id, item]));

const GroupBookingWizard = ({
  isOpen,
  onClose,
  onSubmit,
  providers = [],
  participants = [],
  isSubmitting = false,
  error: submissionError
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState(initialState);
  const [localError, setLocalError] = useState(null);

  const currentStep = useMemo(() => steps[stepIndex], [stepIndex]);

  const providerLookup = useMemo(() => getDefaultLookup(providers), [providers]);
  const participantLookup = useMemo(() => getDefaultLookup(participants), [participants]);

  const handleNext = () => {
    setLocalError(null);
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setLocalError(null);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleChange = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const resetWizard = () => {
    setState(initialState);
    setStepIndex(0);
    setLocalError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const buildPayload = () => {
    if (!state.startDate) {
      throw new Error('Choose a start date for the session.');
    }
    if (!state.providerIds.length) {
      throw new Error('Select at least one provider.');
    }
    const startDateTime = `${state.startDate}T${state.startTime || '09:00'}`;
    const start = zonedTimeToUtc(startDateTime, state.timezone);
    const end = addMinutes(start, Number(state.duration) || 60);

    return {
      name: state.name,
      description: state.description,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: Number(state.duration) || 60,
      max_participants: Math.max(state.participantIds.length, 1),
      metadata: state.notes ? { notes: state.notes } : undefined,
      providers: state.providerIds
        .map((id) => providerLookup[id])
        .filter(Boolean)
        .map((provider) => ({
          userId: provider.userId ?? provider.id,
          calendarId: provider.calendarId ?? null
        })),
      participants: state.participantIds
        .map((id) => participantLookup[id])
        .filter(Boolean)
        .map((participant) => ({
          userId: participant.userId ?? participant.id,
          metadata: participant.metadata ?? null
        }))
    };
  };

  const handleSubmit = async () => {
    setLocalError(null);
    try {
      const payload = buildPayload();
      await onSubmit?.(payload);
      resetWizard();
      onClose();
    } catch (error) {
      setLocalError(error.message ?? 'Unable to create group booking.');
    }
  };

  const isProviderStep = currentStep.id === 'providers';
  const isParticipantsStep = currentStep.id === 'participants';
  const isReviewStep = currentStep.id === 'review';
  const canAdvance =
    stepIndex < steps.length - 1
      ? !isProviderStep || state.providerIds.length > 0
      : state.providerIds.length > 0 && state.startDate;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Create Group Booking"
      description="Coordinate a multi-provider session"
    >
      <ModalBody className="group-wizard">
        <div className="group-wizard__sidebar">
          <StepIndicator steps={steps} activeStep={stepIndex} onStepChange={setStepIndex} />
        </div>
        <div className="group-wizard__content">
          {currentStep.id === 'details' && (
            <SessionDetailsStep value={state} onChange={handleChange} />
          )}
          {currentStep.id === 'providers' && (
            <ProviderSelectionStep
              providers={providers}
              selectedProviderIds={state.providerIds}
              onChange={(providerIds) => handleChange({ providerIds })}
            />
          )}
          {currentStep.id === 'participants' && (
            <ParticipantStep
              participants={participants}
              selectedParticipantIds={state.participantIds}
              onChange={(participantIds) => handleChange({ participantIds })}
            />
          )}
          {currentStep.id === 'review' && (
            <ReviewStep value={state} providers={providers} participants={participants} />
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <div className="group-wizard__status">
          {isProviderStep && providers.length === 0 && (
            <p className="group-wizard__error" role="alert">
              No providers are available yet. Create an active calendar for a provider to continue.
            </p>
          )}
          {isParticipantsStep && !participants.length && (
            <p className="group-wizard__hint">
              Add participants later once invitations are ready. This step is optional.
            </p>
          )}
          {localError && (
            <p className="group-wizard__error" role="alert">
              {localError}
            </p>
          )}
          {submissionError && (
            <p className="group-wizard__error" role="alert">
              {submissionError}
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        {stepIndex > 0 && (
          <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        {stepIndex < steps.length - 1 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={isSubmitting || !canAdvance}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || !canAdvance}
          >
            Create Booking
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default GroupBookingWizard;
