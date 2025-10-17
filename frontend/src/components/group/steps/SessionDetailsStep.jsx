import { Card, CardContent } from '../../ui/Card.jsx';
import '../group.css';

const SessionDetailsStep = ({ value, onChange }) => (
  <Card>
    <CardContent className="group-step__content">
      <label className="group-field">
        <span>Session Name</span>
        <input
          type="text"
          value={value.name}
          placeholder="Team Strategy Workshop"
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </label>
      <label className="group-field">
        <span>Description</span>
        <textarea
          rows={3}
          value={value.description}
          placeholder="Outline the goal of this session"
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <div className="group-field-grid">
        <label className="group-field">
          <span>Preferred Start Date</span>
          <input
            type="date"
            value={value.startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
          />
        </label>
        <label className="group-field">
          <span>Start Time</span>
          <input
            type="time"
            value={value.startTime}
            onChange={(event) => onChange({ startTime: event.target.value })}
          />
        </label>
        <label className="group-field">
          <span>Duration (minutes)</span>
          <input
            type="number"
            min={30}
            step={15}
            value={value.duration}
            onChange={(event) => onChange({ duration: Number(event.target.value) })}
          />
        </label>
        <label className="group-field">
          <span>Timezone</span>
          <select
            value={value.timezone}
            onChange={(event) => onChange({ timezone: event.target.value })}
          >
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </label>
      </div>
      <label className="group-field">
        <span>Internal Notes</span>
        <textarea
          rows={3}
          value={value.notes}
          placeholder="Share details for providers"
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </label>
    </CardContent>
  </Card>
);

export default SessionDetailsStep;
