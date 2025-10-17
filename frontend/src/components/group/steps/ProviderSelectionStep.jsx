import { Card, CardContent } from '../../ui/Card.jsx';
import '../group.css';

const ProviderSelectionStep = ({ providers, selectedProviderIds, onChange }) => {
  const toggleProvider = (id) => {
    if (selectedProviderIds.includes(id)) {
      onChange(selectedProviderIds.filter((providerId) => providerId !== id));
    } else {
      onChange([...selectedProviderIds, id]);
    }
  };

  return (
    <Card>
      <CardContent className="group-step__content">
        <p>Select providers who must attend this session.</p>
        {!providers.length && <p>No eligible providers were found. Ensure calendars are assigned.</p>}
        <div className="group-list">
          {providers.map((provider) => (
            <label key={provider.id} className="group-list__item">
              <input
                type="checkbox"
                checked={selectedProviderIds.includes(provider.id)}
                onChange={() => toggleProvider(provider.id)}
              />
              <div>
                <strong>{provider.name}</strong>
                <div className="group-meta">
                  Skills: {(provider.skills ?? []).length ? provider.skills.join(', ') : 'N/A'}
                </div>
              </div>
              <span className="group-badge">Availability: {provider.availability ?? 'Unknown'}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderSelectionStep;
