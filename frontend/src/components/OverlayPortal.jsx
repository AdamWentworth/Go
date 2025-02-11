import { createPortal } from 'react-dom';

// Provide a reusable Portal component that renders its children
// into document.body (or a dedicated <div id="portal-root">).
function OverlayPortal({ children }) {
  return createPortal(children, document.body);
}

export default OverlayPortal;
