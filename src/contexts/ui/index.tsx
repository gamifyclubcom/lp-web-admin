import { createContext, useState } from 'react';
import { EModalType } from './enum';

interface IFeedbackComponent<T> {
  open: boolean;
  type: T | null;
  props: object | null;
}

interface UIState {
  modal: IFeedbackComponent<EModalType>;
  openModal: (type: EModalType, props?: object) => void;
  closeModal: () => void;
  checkOpen: (variant: 'modal', type: EModalType) => boolean;
}

const UIContext = createContext<UIState>({
  modal: {
    open: false,
    type: null,
    props: null,
  },
  openModal: () => {},
  closeModal: () => {},
  checkOpen: () => false,
});

export const UIProvider: React.FC = ({ children }) => {
  const [modal, setModal] = useState<IFeedbackComponent<EModalType>>({
    open: false,
    type: null,
    props: null,
  });

  const openModal = (modalType: EModalType, modalProps?: object) => {
    setModal((prev) => ({
      open: true,
      type: modalType,
      props: modalProps ? modalProps : null,
    }));
  };
  const closeModal = () => {
    setModal({
      open: false,
      type: null,
      props: null,
    });
  };

  const checkOpen = (variant: 'modal' | 'drawer', type: EModalType): boolean => {
    if (variant === 'modal' && (type as EModalType)) {
      return modal.type === type;
    }
    return false;
  };

  return (
    <UIContext.Provider
      value={{
        modal,
        openModal,
        closeModal,
        checkOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export default UIContext;
