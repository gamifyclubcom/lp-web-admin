import { Actions, ICommonSetting } from '@gamify/onchain-program-sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { useConnection } from '../hooks';

interface GlobalState {
  commonSettings: ICommonSetting | null;
  setCommonSettings: Dispatch<SetStateAction<ICommonSetting | null>>;
}

const GlobalContext = createContext<GlobalState>({
  commonSettings: null,
  setCommonSettings: () => {},
});

export const GlobalProvider: React.FC = ({ children }) => {
  const { connected } = useWallet();
  const { connection } = useConnection();
  const [commonSettings, setCommonSettings] = useState<ICommonSetting | null>(
    null
  );

  useEffect(() => {
    const readCommonSetting = async () => {
      if (connected) {
        const action = new Actions(connection);
        const result = await action.readCommonSettingByProgramId();

        setCommonSettings(result);
      }
    };

    readCommonSetting();
  }, [connected, connection]);

  return (
    <GlobalContext.Provider
      value={{
        commonSettings,
        setCommonSettings,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export { GlobalContext };
