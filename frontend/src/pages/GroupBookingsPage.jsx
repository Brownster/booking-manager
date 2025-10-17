import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import Button from '../components/ui/Button.jsx';
import { Card, CardContent, CardTitle } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import PermissionGate from '../components/auth/PermissionGate.jsx';
import GroupBookingWizard from '../components/group/GroupBookingWizard.jsx';
import useDisclosure from '../hooks/useDisclosure.js';
import { useFeatureFlags } from '../context/FeatureFlagContext.jsx';
import { createGroupAppointment, fetchGroupAppointments } from '../services/groupAppointmentService.js';
import { fetchCalendars } from '../services/calendarService.js';
import { fetchWaitlistEntries } from '../services/waitlistService.js';
import './page-layout.css';
import './group.css';

const sampleSessions = [
  {
    id: 'session-1',
    name: 'Team Workshop',
    date: 'Nov 1, 2025',
    status: 'Planning',
    providers: ['Sarah Johnson', 'Mike Davis'],
    participants: 4
  },
  {
    id: 'session-2',
    name: 'Product Training',
    date: 'Nov 10, 2025',
    status: 'Scheduled',
    providers: ['Emma Wilson'],
    participants: 6
  }
];

const GroupBookingsPage = () => {
  const featureFlags = useFeatureFlags();
  const wizardDisclosure = useDisclosure(false);
  const queryClient = useQueryClient();

  const { data: groupAppointments, isLoading: isLoadingAppointments, isError } = useQuery({
    queryKey: ['groupAppointments'],
    queryFn: () => fetchGroupAppointments(),
    placeholderData: sampleSessions
  });

  const { data: calendars } = useQuery({
    queryKey: ['calendars'],
    queryFn: () => fetchCalendars(),
    placeholderData: []
  });

  const { data: waitlistEntries } = useQuery({
    queryKey: ['waitlist', 'groupCandidates'],
    queryFn: () => fetchWaitlistEntries({ status: 'active' }),
    placeholderData: []
  });

  const createMutation = useMutation({
    mutationFn: createGroupAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries(['groupAppointments']);
    }
  });

  const providerOptions = useMemo(
    () =>
      (calendars ?? [])
        .filter((calendar) => calendar.is_active && calendar.provider_user_id)
        .map((calendar) => ({
          id: calendar.id,
          userId: calendar.provider_user_id,
          name: calendar.service_type || `Calendar ${calendar.id.slice(0, 8)}`,
          skills: calendar.skills ?? [],
          availability: calendar.is_active ? 'Available' : 'Inactive',
          calendarId: calendar.id
        })),
    [calendars]
  );

  const providerNameLookup = useMemo(
    () =>
      new Map(
        providerOptions.map((provider) => [
          provider.userId,
          provider.name ?? `Provider ${provider.userId.slice(0, 8)}`
        ])
      ),
    [providerOptions]
  );

  const participantOptions = useMemo(() => {
    const unique = new Map();
    (waitlistEntries ?? []).forEach((entry) => {
      const userId = entry.clientUserId || entry.client_user_id;
      if (!userId || unique.has(userId)) {
        return;
      }
      const name =
        entry.clientName ||
        entry.client_name ||
        `Client ${String(userId).slice(0, 8)}`;
      unique.set(userId, {
        id: entry.id,
        userId,
        name,
        email: entry.clientEmail || entry.client_email || '',
        metadata: { waitlistEntryId: entry.id }
      });
    });
    return Array.from(unique.values());
  }, [waitlistEntries]);

  const formatSessionRow = (session) => {
    if (!session) {
      return null;
    }
    const startTime = session.start_time ? new Date(session.start_time) : null;
    return {
      id: session.id,
      name: session.name ?? 'Untitled session',
      date: startTime ? format(startTime, 'PPpp') : 'Unscheduled',
      status: session.status ?? 'scheduled',
      providers: (session.providers ?? []).map((provider) => {
        const name = providerNameLookup.get(provider.provider_user_id);
        if (name) {
          return name;
        }
        if (provider.provider_user_id) {
          return `Provider ${provider.provider_user_id.slice(0, 8)}`;
        }
        return 'Provider';
      }),
      participants: session.participants?.length ?? 0
    };
  };

  const sessions = useMemo(() => {
    if (!groupAppointments) {
      return sampleSessions;
    }
    if (Array.isArray(groupAppointments) && groupAppointments.length && groupAppointments[0].start_time) {
      return groupAppointments
        .map(formatSessionRow)
        .filter(Boolean);
    }
    return groupAppointments;
  }, [groupAppointments]);

  if (!featureFlags.groupBookings) {
    return (
      <div className="page">
        <header className="page__header">
          <div>
            <h1 className="page__title">Group Bookings</h1>
            <p className="page__subtitle">This feature flag is disabled for your tenant.</p>
          </div>
        </header>
      </div>
    );
  }

  const handleWizardSubmit = async (payload) => {
    await createMutation.mutateAsync(payload);
  };

  const renderStatus = (status) => {
    if (!status) {
      return null;
    }
    return <Badge variant="info">{status}</Badge>;
  };

  const providersForWizard = providerOptions;

  const participantsForWizard = participantOptions;

  const isCreateDisabled = providerOptions.length === 0;

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Group Bookings</h1>
          <p className="page__subtitle">
            Coordinate multi-provider sessions with shared availability and confirmation workflows.
          </p>
        </div>
        <PermissionGate permissions="groupAppointments:create">
          <Button
            variant="primary"
            onClick={wizardDisclosure.onOpen}
            disabled={isCreateDisabled}
          >
            Create Group Booking
          </Button>
        </PermissionGate>
      </header>

      <div className="page__stack">
        {isCreateDisabled && (
          <p role="note">
            Add at least one active calendar for a provider before creating a group booking.
          </p>
        )}
        {isLoadingAppointments && <p>Loading group appointments…</p>}
        {!isLoadingAppointments && isError && (
          <p role="alert">Unable to load group appointments right now. Showing recent drafts instead.</p>
        )}
        {!isLoadingAppointments &&
          sessions.map((session) => (
            <Card key={session.id} hoverable>
              <CardTitle>
                {session.name} {renderStatus(session.status)}
              </CardTitle>
              <CardContent>
                <div>
                  <strong>Scheduled:</strong> {session.date}
                </div>
                <div>
                  <strong>Providers:</strong>{' '}
                  {Array.isArray(session.providers) ? session.providers.join(', ') : session.providers}
                </div>
                <div>
                  <strong>Participants:</strong> {session.participants}
                </div>
              </CardContent>
            </Card>
          ))}
        {!isLoadingAppointments && sessions.length === 0 && <p>No group sessions scheduled yet.</p>}
      </div>

      <PermissionGate permissions="groupAppointments:create">
        <GroupBookingWizard
          isOpen={wizardDisclosure.isOpen}
          onClose={wizardDisclosure.onClose}
          onSubmit={handleWizardSubmit}
          providers={providersForWizard}
          participants={participantsForWizard}
          isSubmitting={createMutation.isLoading}
          error={
            createMutation.isError
              ? createMutation.error?.response?.data?.error?.message ?? createMutation.error?.message
              : null
          }
        />
      </PermissionGate>

      <footer className="page__footer-hint">
        <Badge variant="info">Beta</Badge>
        <span>Group bookings sync across providers once all confirmations complete.</span>
      </footer>
    </div>
  );
};

export default GroupBookingsPage;
