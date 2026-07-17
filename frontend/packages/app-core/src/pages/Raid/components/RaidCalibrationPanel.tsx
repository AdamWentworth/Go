import {
  FaChartLine,
  FaDownload,
  FaStopwatch,
  FaTrashAlt,
} from "react-icons/fa";
import type { RaidCalibrationProfile } from "../utils/raidCalibration";

type RaidCalibrationPanelProps = {
  profile: RaidCalibrationProfile;
  enabled: boolean;
  disabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onLogRaid: () => void;
  onClear: () => void;
  onExport: () => void;
};

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

const RaidCalibrationPanel = ({
  profile,
  enabled,
  disabled,
  onEnabledChange,
  onLogRaid,
  onClear,
  onExport,
}: RaidCalibrationPanelProps) => (
  <section className="raid-calibration" aria-label="Observed raid calibration">
    <div className="raid-calibration-heading">
      <FaChartLine aria-hidden="true" />
      <div>
        <strong>Battle calibration</strong>
        <span>
          Private to this device
          {profile.medianLatencyMs == null
            ? ""
            : ` · ${Math.round(profile.medianLatencyMs)} ms median`}
        </span>
      </div>
    </div>

    <dl className="raid-calibration-metrics">
      <div>
        <dt>Raids</dt>
        <dd>{profile.sampleCount}</dd>
      </div>
      <div>
        <dt>Exact parties</dt>
        <dd>{profile.exactPartySampleCount}</dd>
      </div>
      <div>
        <dt>TTW error</dt>
        <dd>
          {profile.clearSampleCount > 0
            ? formatPercent(profile.meanAbsoluteTimingErrorPercent)
            : "-"}
        </dd>
      </div>
      <div>
        <dt>P90 error</dt>
        <dd>
          {profile.clearSampleCount > 0
            ? `${Math.round(profile.p90AbsoluteTimingErrorSeconds)}s`
            : "-"}
        </dd>
      </div>
      <div>
        <dt>Outcome</dt>
        <dd>
          {profile.sampleCount > 0
            ? formatPercent(profile.predictedOutcomeAccuracy)
            : "-"}
        </dd>
      </div>
      <div>
        <dt>Dodge</dt>
        <dd>
          {profile.dodgeAttempts > 0
            ? formatPercent(profile.dodgeSuccessRate)
            : "-"}
        </dd>
      </div>
    </dl>

    <div className="raid-calibration-actions">
      <button
        className="raid-calibration-log"
        disabled={disabled}
        onClick={onLogRaid}
        type="button"
      >
        <FaStopwatch aria-hidden="true" />
        <span>Log raid</span>
      </button>
      <label
        className="raid-calibration-toggle"
        title={
          profile.canApplyDodgeCalibration
            ? undefined
            : "Requires 5 raids and 10 dodge attempts"
        }
      >
        <input
          checked={enabled}
          disabled={!profile.canApplyDodgeCalibration}
          onChange={(event) => onEnabledChange(event.target.checked)}
          type="checkbox"
        />
        <span>Use observed dodges</span>
      </label>
      {profile.sampleCount > 0 && (
        <button
          aria-label="Export observed raid data"
          className="raid-calibration-export"
          onClick={onExport}
          title="Export observed raid data"
          type="button"
        >
          <FaDownload aria-hidden="true" />
        </button>
      )}
      {profile.sampleCount > 0 && (
        <button
          aria-label="Clear observed raid data"
          className="raid-calibration-clear"
          onClick={onClear}
          title="Clear observed raid data"
          type="button"
        >
          <FaTrashAlt aria-hidden="true" />
        </button>
      )}
    </div>
  </section>
);

export default RaidCalibrationPanel;
