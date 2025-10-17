import clsx from 'clsx';
import '../../pages/group.css';

const StepIndicator = ({ steps, activeStep, onStepChange }) => (
  <ol className="group-steps">
    {steps.map((step, index) => (
      <li
        key={step.id}
        className={clsx(
          'group-steps__item',
          index === activeStep && 'group-steps__item--active',
          index < activeStep && 'group-steps__item--complete'
        )}
      >
        <button type="button" onClick={() => onStepChange(index)}>
          <span className="group-steps__number">{index + 1}</span>
          <span>{step.title}</span>
        </button>
      </li>
    ))}
  </ol>
);

export default StepIndicator;
