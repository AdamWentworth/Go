import React from 'react';

import LocationSearch from './SearchParameters/LocationSearch';
import OwnershipSearch from './SearchParameters/OwnershipSearch';

type LocationSearchProps = React.ComponentProps<typeof LocationSearch>;
type OwnershipSearchProps = React.ComponentProps<typeof OwnershipSearch>;

type SearchSecondaryPanelsProps = {
  isMidWidth: boolean;
  locationProps: LocationSearchProps;
  ownershipProps: OwnershipSearchProps;
};

const SearchSecondaryPanels: React.FC<SearchSecondaryPanelsProps> = ({
  isMidWidth,
  locationProps,
  ownershipProps,
}) => {
  const panels = (
    <>
      <div className="location-search">
        <LocationSearch {...locationProps} />
      </div>
      <div className="ownership-status">
        <OwnershipSearch {...ownershipProps} />
      </div>
    </>
  );

  if (isMidWidth) {
    return <div className="location-ownership-row">{panels}</div>;
  }

  return panels;
};

export default SearchSecondaryPanels;
