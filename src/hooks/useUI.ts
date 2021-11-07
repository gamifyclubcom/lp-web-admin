import UIContext from '../contexts/ui';
import { useContext } from 'react';

function useUI() {
  const context = useContext(UIContext);
  return context;
}

export default useUI;
