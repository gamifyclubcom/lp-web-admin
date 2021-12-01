import { useContext } from 'react';
import { GlobalContext } from '../contexts/global';

export function useGlobal() {
  const context = useContext(GlobalContext);
  return context;
}
