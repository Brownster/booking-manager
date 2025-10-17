import { Card, CardContent } from '../../ui/Card.jsx';
import Badge from '../../ui/Badge.jsx';
import '../group.css';

const ReviewStep = ({ value, providers, participants }) => {
  const providerLookup = Object.fromEntries(providers.map((provider) => [provider.id, provider.name]));
  const participantLookup = Object.fromEntries(participants.map((participant) => [participant.id, participant.name]));

  return (
    <Card>
      <CardContent className="group-step__content">
        <section>
          <h3>Session Summary</h3>
          <p>
            <strong>{value.name || 'Untitled session'}</strong>
          </p>
          <p>{value.description || 'No description provided yet.'}</p>
          <div className="group-summary">
            <span>
              <strong>Duration:</strong> {value.duration} minutes
            </span>
            <span>
              <strong>Preferred Date:</strong>{' '}
              {value.startDate ? `${value.startDate} ${value.startTime || ''}` : 'Flexible'}
            </span>
            <span>
              <strong>Timezone:</strong> {value.timezone}
            </span>
          </div>
        </section>

        <section>
          <h3>Providers</h3>
          <div className="group-chip-row">
            {value.providerIds.length ? (
              value.providerIds.map((id) => (
                <Badge key={id} variant="info">
                  {providerLookup[id] || id}
                </Badge>
              ))
            ) : (
              <span>No providers selected yet.</span>
            )}
          </div>
        </section>

        <section>
          <h3>Participants</h3>
          <div className="group-chip-row">
            {value.participantIds.length ? (
              value.participantIds.map((id) => (
                <Badge key={id} variant="default">
                  {participantLookup[id] || id}
                </Badge>
              ))
            ) : (
              <span>No additional participants.</span>
            )}
          </div>
        </section>

        {value.notes && (
          <section>
            <h3>Internal Notes</h3>
            <p>{value.notes}</p>
          </section>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewStep;
