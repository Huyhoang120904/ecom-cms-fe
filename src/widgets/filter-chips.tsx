import { X } from "react-feather";

export interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

/** Active filters as removable buttons plus a clear-all. Renders nothing when empty. */
export default function FilterChips({ chips, onRemove, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="filter-chips">
      <ul className="filter-chip-list">
        {chips.map((chip) => (
          <li key={chip.id}>
            <button
              type="button"
              className="filter-chip"
              aria-label={`Remove ${chip.label} filter: ${chip.value}`}
              onClick={() => onRemove(chip.id)}
            >
              <span aria-hidden="true">
                {chip.label}: {chip.value}
              </span>
              <X size={13} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-link btn-sm text-decoration-none px-1"
        onClick={onClearAll}
      >
        Clear all
      </button>
    </div>
  );
}
