import { Card, CardContent } from '../../ui/Card.jsx';
import '../group.css';

const ParticipantStep = ({ participants, selectedParticipantIds, onChange }) => {
  const toggleParticipant = (id) => {
    if (selectedParticipantIds.includes(id)) {
      onChange(selectedParticipantIds.filter((participantId) => participantId !== id));
    } else {
      onChange([...selectedParticipantIds, id]);
    }
  };

  return (
    <Card>
      <CardContent className="group-step__content">
        <p>Select optional participants or observers.</p>
        <div className="group-list">
          {participants.map((participant) => (
            <label key={participant.id} className="group-list__item">
              <input
                type="checkbox"
                checked={selectedParticipantIds.includes(participant.id)}
                onChange={() => toggleParticipant(participant.id)}
              />
              <div>
                <strong>{participant.name}</strong>
                <div className="group-meta">{participant.email}</div>
              </div>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipantStep;
