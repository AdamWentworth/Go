// NavigationSection.jsx

import React from 'react';
import './NavigationSection.css';

const NavigationSection = () => {
  return (
    <div className="row">
      <div className="navCard">
        <img src="/images/btn_action_menu.png" alt="Action Menu Button" />
        <h3>Navigation &amp; Settings</h3>
        <p>
          Tap this button at the bottom of your screen to navigate between features and update your account preferences.
        </p>
      </div>
    </div>
  );
};

export default NavigationSection;
