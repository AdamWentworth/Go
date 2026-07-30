export type TradeHubSection = 'matches' | 'active' | 'history';

interface TradeStatusButtonsProps {
  selectedSection: TradeHubSection;
  setSelectedSection: (section: TradeHubSection) => void;
  activeCount?: number;
}

const sections: ReadonlyArray<{
  value: TradeHubSection;
  label: string;
  description: string;
}> = [
  { value: 'matches', label: 'Matches', description: 'Find reciprocal trades' },
  { value: 'active', label: 'Active', description: 'Offers and trades in progress' },
  { value: 'history', label: 'History', description: 'Completed and closed trades' },
];

function TradeStatusButtons({
  selectedSection,
  setSelectedSection,
  activeCount = 0,
}: TradeStatusButtonsProps) {
  return (
    <nav className="trade-hub-tabs" aria-label="Trade sections">
      {sections.map((section) => (
        <button
          key={section.value}
          type="button"
          aria-current={selectedSection === section.value ? 'page' : undefined}
          onClick={() => setSelectedSection(section.value)}
          className={selectedSection === section.value ? 'trade-hub-tab active' : 'trade-hub-tab'}
        >
          <span>
            {section.label}
            {section.value === 'active' && activeCount > 0 ? (
              <span className="trade-hub-count" aria-label={`${activeCount} active trades`}>
                {activeCount}
              </span>
            ) : null}
          </span>
          <small>{section.description}</small>
        </button>
      ))}
    </nav>
  );
}

export default TradeStatusButtons;
