import React from 'react';

const OwnershipSearch = ({ ownershipStatus, setOwnershipStatus }) => {
  return (
    <div className="ownership-status">
      <h3>Ownership Status</h3>
      <div>
        <label>
          <input
            type="radio"
            value="owned"
            checked={ownershipStatus === 'owned'}
            onChange={() => setOwnershipStatus('owned')}
          />
          Owned
        </label>
        <label>
          <input
            type="radio"
            value="trade"
            checked={ownershipStatus === 'trade'}
            onChange={() => setOwnershipStatus('trade')}
          />
          Trade
        </label>
        <label>
          <input
            type="radio"
            value="wanted"
            checked={ownershipStatus === 'wanted'}
            onChange={() => setOwnershipStatus('wanted')}
          />
          Wanted
        </label>
      </div>
    </div>
  );
};

export default OwnershipSearch;
