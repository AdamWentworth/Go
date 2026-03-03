import React, { useMemo } from 'react';
import './CaughtDateRibbon.css';

interface CaughtDateRibbonProps {
  dateCaught: string | null;
}

const DEFAULT_YEAR = '----';
const DEFAULT_MMDD = '-- --';

const CaughtDateRibbon: React.FC<CaughtDateRibbonProps> = ({ dateCaught }) => {
  const { year, mmdd } = useMemo(() => {
    const raw = (dateCaught ?? '').trim();
    if (!raw) return { year: DEFAULT_YEAR, mmdd: DEFAULT_MMDD };

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return { year: raw.slice(0, 4), mmdd: raw.slice(5, 10) };
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return { year: DEFAULT_YEAR, mmdd: DEFAULT_MMDD };
    }

    const iso = parsed.toISOString().slice(0, 10);
    return { year: iso.slice(0, 4), mmdd: iso.slice(5, 10) };
  }, [dateCaught]);

  return (
    <div className="caught-date-ribbon" aria-label={`Caught date ${year} ${mmdd}`}>
      <span className="caught-date-ribbon-ball" aria-hidden="true" />
      <span className="caught-date-ribbon-text">
        <span className="caught-date-ribbon-year">{year}</span>
        <span className="caught-date-ribbon-mmdd">{mmdd}</span>
      </span>
    </div>
  );
};

export default CaughtDateRibbon;

