export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  name: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * One-tap option group backed by real radio inputs, so arrow-key navigation,
 * checked state, and group semantics come from the platform.
 */
export default function SegmentedControl<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="segmented-control" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value} className="segmented-option">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="visually-hidden"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
