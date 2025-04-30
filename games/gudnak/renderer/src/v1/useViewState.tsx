import { createContext, useContext, useState } from 'react';

type ViewState =
  | { kind: 'game' }
  | { kind: 'cardViewer'; cardInstanceId: string };

const ViewStateContext = createContext<{
  viewState: ViewState;
  setViewState: (vs: ViewState) => void;
}>({
  viewState: { kind: 'game' },
  setViewState: () => {},
});

export const ViewStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [viewState, setViewState] = useState<ViewState>({
    kind: 'game',
  });

  return (
    <ViewStateContext.Provider value={{ viewState, setViewState }}>
      {children}
    </ViewStateContext.Provider>
  );
};

export const useViewState = () => {
  const context = useContext(ViewStateContext);
  if (!context) {
    throw new Error('useViewState must be used within a ViewStateProvider');
  }
  return context;
};
