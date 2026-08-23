export const ACTION_MENU_OPEN_REQUEST = 'pokegonexus:action-menu-open-request';

export const requestActionMenuOpen = () => {
  window.dispatchEvent(new Event(ACTION_MENU_OPEN_REQUEST));
};
