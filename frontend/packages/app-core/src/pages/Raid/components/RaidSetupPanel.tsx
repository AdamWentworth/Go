import type { ReactNode } from "react";
import { FaChevronDown, FaTools } from "react-icons/fa";

type RaidSetupPanelProps = {
  tierLabel: string;
  children: ReactNode;
};

const RaidSetupPanel = ({ tierLabel, children }: RaidSetupPanelProps) => (
  <details className="raid-setup-panel">
    <summary>
      <FaTools aria-hidden="true" />
      <span>
        <strong>Raid setup</strong>
        <small>{tierLabel} · team, settings, and raid log</small>
      </span>
      <FaChevronDown className="raid-setup-chevron" aria-hidden="true" />
    </summary>
    <div className="raid-setup-content">{children}</div>
  </details>
);

export default RaidSetupPanel;
