import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import PermissionGate from '../components/auth/PermissionGate.jsx';
import Modal, { ModalBody, ModalFooter } from '../components/ui/Modal.jsx';
import useDisclosure from '../hooks/useDisclosure.js';
import {
  fetchWaitlistEntries,
  createWaitlistEntry,
  promoteWaitlistEntry,
  cancelWaitlistEntry,
  deleteWaitlistEntry
} from '../services/waitlistService.js';
import './page-layout.css';
import './waitlist.css';

const sampleClients = [
  { id: 'client-1', name: 'Jessica Smith' },
  { id: 'client-2', name: 'John Doe' },
  { id: 'client-3', name: 'Maria Garcia' }
];

const sampleProviders = [
  { id: 'provider-1', name: 'Sarah Johnson' },
  { id: 'provider-2', name: 'Mike Davis' },
  { id: 'provider-3', name: 'Emma Wilson' }
];

const priorityBadgeVariant = {
  high: 'danger',
  medium: 'warning',
  low: 'info'
};

const statusBadgeVariant = {
  active: 'success',
  promoted: 'info',
  cancelled: 'danger'
};

const formatWindow = (start, end) => {
  if (!start && !end) {
    return 'Flexible';
  }

  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (startDate && endDate && startDate.toDateString() === endDate.toDateString()) {
    return `${startDate.toLocaleDateString()} · ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (startDate && endDate) {
    return `${startDate.toLocaleString()} – ${endDate.toLocaleString()}`;
  }

  if (startDate) {
    return startDate.toLocaleString();
  }

  if (endDate) {
    return endDate.toLocaleString();
  }

  return 'Flexible';
};

const WaitlistFilters = ({ status, priority, providerId, onChange }) => (
  <div className="page__filters">
    <label className="page__filter-group">
      <span>Status</span>
      <select value={status} onChange={(event) => onChange({ status: event.target.value })}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="promoted">Promoted</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </label>
    <label className="page__filter-group">
      <span>Priority</span>
      <select value={priority} onChange={(event) => onChange({ priority: event.target.value })}>
        <option value="all">All</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </label>
    <label className="page__filter-group">
      <span>Provider</span>
      <select value={providerId} onChange={(event) => onChange({ providerId: event.target.value })}>
        <option value="all">All Providers</option>
        {sampleProviders.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
    </label>
  </div>
);

const WaitlistCard = ({ entry, onPromote, onCancel, onDelete }) => (
  <Card hoverable>
    <CardHeader>
      <CardTitle>{entry.clientName}</CardTitle>
      <Badge variant={statusBadgeVariant[entry.status] ?? 'default'}>{entry.status}</Badge>
    </CardHeader>
    <CardContent className="waitlist-card__content">
      <div>
        <strong>Provider:</strong> {entry.providerName}
      </div>
      <div>
        <strong>Requested:</strong> {formatWindow(entry.requestedStart, entry.requestedEnd)}
      </div>
      <div className="waitlist-card__tags">
        <Badge variant={priorityBadgeVariant[entry.priority] ?? 'default'}>
          Priority: {entry.priority}
        </Badge>
        <Badge variant={entry.autoPromote ? 'success' : 'warning'}>
          {entry.autoPromote ? 'Auto-Promote Enabled' : 'Manual Promotion'}
        </Badge>
        <Badge variant="info">Position #{entry.position}</Badge>
      </div>
      <div className="waitlist-card__actions">
        <PermissionGate permissions="waitlist:manage">
          <Button size="sm" variant="ghost" onClick={onPromote}>
            Promote
          </Button>
        </PermissionGate>
        <PermissionGate permissions="waitlist:manage">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </PermissionGate>
        <PermissionGate permissions="waitlist:manage">
          <Button size="sm" variant="ghost" onClick={onDelete}>
            Delete
          </Button>
        </PermissionGate>
      </div>
      {entry.notes && <div className="waitlist-card__notes">{entry.notes}</div>}
    </CardContent>
  </Card>
);

const WaitlistCreateModal = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    clientUserId: sampleClients[0]?.id ?? '',
    providerUserId: sampleProviders[0]?.id ?? '',
    priority: 'medium',
    requestedStart: '',
    requestedEnd: '',
    autoPromote: false,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        clientUserId: sampleClients[0]?.id ?? '',
        providerUserId: sampleProviders[0]?.id ?? '',
        priority: 'medium',
        requestedStart: '',
        requestedEnd: '',
        autoPromote: false,
        notes: ''
      });
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      clientUserId: form.clientUserId,
      providerUserId: form.providerUserId,
      priority: form.priority,
      requestedStart: form.requestedStart || undefined,
      requestedEnd: form.requestedEnd || undefined,
      autoPromote: Boolean(form.autoPromote),
      notes: form.notes || undefined
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Add to Waitlist">
      <ModalBody>
        <form id="waitlist-create-form" className="waitlist-form" onSubmit={handleSubmit}>
          <label className="waitlist-form__field">
            <span>Client</span>
            <select
              value={form.clientUserId}
              onChange={(event) => handleChange('clientUserId', event.target.value)}
            >
              {sampleClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className="waitlist-form__field">
            <span>Provider</span>
            <select
              value={form.providerUserId}
              onChange={(event) => handleChange('providerUserId', event.target.value)}
            >
              {sampleProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </label>

          <label className="waitlist-form__field">
            <span>Priority</span>
            <select value={form.priority} onChange={(event) => handleChange('priority', event.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <div className="waitlist-form__grid">
            <label className="waitlist-form__field">
              <span>Requested Start</span>
              <input
                type="datetime-local"
                value={form.requestedStart}
                onChange={(event) => handleChange('requestedStart', event.target.value)}
              />
            </label>
            <label className="waitlist-form__field">
              <span>Requested End</span>
              <input
                type="datetime-local"
                value={form.requestedEnd}
                onChange={(event) => handleChange('requestedEnd', event.target.value)}
              />
            </label>
          </div>

          <label className="waitlist-form__field waitlist-form__toggle">
            <input
              type="checkbox"
              checked={form.autoPromote}
              onChange={(event) => handleChange('autoPromote', event.target.checked)}
            />
            Enable auto-promote when slot found
          </label>

          <label className="waitlist-form__field">
            <span>Notes</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
            />
          </label>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form="waitlist-create-form">
          Save Entry
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const WaitlistPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', providerId: 'all' });
  const createModal = useDisclosure(false);

  const requestFilters = useMemo(() => {
    const params = {};
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.priority !== 'all') params.priority = filters.priority;
    if (filters.providerId !== 'all') params.providerUserId = filters.providerId;
    return params;
  }, [filters]);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['waitlist', requestFilters],
    queryFn: () => fetchWaitlistEntries(requestFilters)
  });

  const createMutation = useMutation({
    mutationFn: createWaitlistEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    }
  });

  const promoteMutation = useMutation({
    mutationFn: promoteWaitlistEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: ({ entryId, reason }) => cancelWaitlistEntry(entryId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWaitlistEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    }
  });

  const providerLookup = useMemo(
    () => Object.fromEntries(sampleProviders.map((provider) => [provider.id, provider.name])),
    []
  );

  const clientLookup = useMemo(
    () => Object.fromEntries(sampleClients.map((client) => [client.id, client.name])),
    []
  );

  const normalizedEntries = useMemo(
    () =>
      entries.map((entry, index) => {
        const priority = (entry.priority || 'medium').toLowerCase();
        const status = (entry.status || 'active').toLowerCase();
        const providerId = entry.providerUserId || entry.provider_user_id || 'unassigned';
        const clientId = entry.clientUserId || entry.client_user_id || 'unknown';
        return {
          id: entry.id,
          clientUserId: clientId,
          clientName: entry.clientName || entry.client_name || clientLookup[clientId] || 'Unknown Client',
          providerUserId: providerId,
          providerName: entry.providerName || entry.provider_name || providerLookup[providerId] || 'Unassigned',
          priority,
          status,
          requestedStart: entry.requestedStart || entry.requested_start,
          requestedEnd: entry.requestedEnd || entry.requested_end,
          autoPromote: entry.autoPromote ?? entry.auto_promote ?? false,
          notes: entry.notes || '',
          position: entry.position ?? index + 1
        };
      }),
    [entries, clientLookup, providerLookup]
  );

  const handleFilterChange = (update) => {
    setFilters((prev) => ({ ...prev, ...update }));
  };

  const handleCreate = async (payload) => {
    try {
      await createMutation.mutateAsync(payload);
      createModal.onClose();
    } catch (error) {
      alert('Failed to create waitlist entry.');
      console.error(error);
    }
  };

  const handlePromote = async (entryId) => {
    try {
      await promoteMutation.mutateAsync(entryId);
    } catch (error) {
      alert('Failed to promote entry.');
      console.error(error);
    }
  };

  const handleCancel = async (entryId) => {
    const reason = window.prompt('Cancellation reason (optional)?');
    try {
      await cancelMutation.mutateAsync({ entryId, reason });
    } catch (error) {
      alert('Failed to cancel entry.');
      console.error(error);
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this waitlist entry?')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(entryId);
    } catch (error) {
      alert('Failed to delete entry.');
      console.error(error);
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Waitlist</h1>
          <p className="page__subtitle">
            Track clients waiting for openings, manage promotion workflows, and keep your schedule running smoothly.
          </p>
        </div>
        <div className="page__actions">
          <PermissionGate permissions="waitlist:create">
            <Button variant="primary" onClick={createModal.onOpen}>
              Add to Waitlist
            </Button>
          </PermissionGate>
        </div>
      </header>

      <WaitlistFilters
        status={filters.status}
        priority={filters.priority}
        providerId={filters.providerId}
        onChange={handleFilterChange}
      />

      {isLoading ? (
        <p>Loading waitlist…</p>
      ) : (
        <div className="page__stack">
          {normalizedEntries.map((entry) => (
            <WaitlistCard
              key={entry.id}
              entry={entry}
              onPromote={() => handlePromote(entry.id)}
              onCancel={() => handleCancel(entry.id)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
          {normalizedEntries.length === 0 && <p>No waitlist entries found for the selected filters.</p>}
        </div>
      )}

      <PermissionGate permissions="waitlist:create">
        <WaitlistCreateModal
          isOpen={createModal.isOpen}
          onClose={createModal.onClose}
          onSubmit={handleCreate}
        />
      </PermissionGate>
    </div>
  );
};

export default WaitlistPage;
