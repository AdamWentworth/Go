// OverlayPortal.tsx

import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  children: ReactNode;
};

const OverlayPortal: React.FC<Props> = ({ children }) => {
  return createPortal(children, document.body);
};

export default OverlayPortal;

