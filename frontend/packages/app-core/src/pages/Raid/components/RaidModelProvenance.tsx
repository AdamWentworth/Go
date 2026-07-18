import { FaCircleInfo } from "react-icons/fa6";
import { Link } from "react-router-dom";

const RaidModelProvenance = () => {
  return (
    <Link
      aria-label="Ranking method"
      className="raid-model-provenance"
      to="/raid/methodology"
      title="How raid rankings are calculated"
    >
      <FaCircleInfo aria-hidden="true" />
      <span>Method</span>
    </Link>
  );
};

export default RaidModelProvenance;
