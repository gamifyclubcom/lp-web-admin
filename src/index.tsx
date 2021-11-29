import ReactDOM from 'react-dom';
import App from './App';
import { ToastContainer } from 'react-toastify';
import { ConfirmProvider } from 'material-ui-confirm';
import { ThemeProvider } from '@material-ui/core';

import 'react-toastify/dist/ReactToastify.css';
import './assets/scss/index.scss';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/authContext';

import { ConnectionProvider } from './contexts/connection';
import theme from './utils/theme';
import { materialConfirmOptions } from './config/material-confirm';

import { QueryClient, QueryClientProvider } from 'react-query';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { UIProvider } from './contexts/ui';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { getSolletExtensionWallet } from './wallet-adapters/sollet-extension';
import { getSolletWallet } from './wallet-adapters/custom-providers';
const queryClient = new QueryClient();

if (window.sollet) {
  const wallets = [
    getPhantomWallet(),
    getSolletWallet(),
    getSolletExtensionWallet(),
  ];

  handleSollet(wallets);
} else {
  window.addEventListener('sollet#initialized', handleSollet, {
    once: true,
  });
  setTimeout(handleSollet, 1000);
}

function handleSollet(wallets: any) {
  if (!wallets) {
    wallets = [
      getPhantomWallet(),
      getSolletWallet(),
      getSolletExtensionWallet(),
    ];
  }
  Sentry.init({
    dsn: 'https://51fe6861b8f5406da4be19b1e79018b9@o936371.ingest.sentry.io/5886503',
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.3,
  });
  const { sollet } = window;
  if (sollet) {
    console.log('Solana successfully detected!');
    ReactDOM.render(
      <ThemeProvider theme={theme}>
        <WalletProvider wallets={wallets} autoConnect>
          <UIProvider>
            <ConfirmProvider defaultOptions={materialConfirmOptions}>
              <ConnectionProvider>
                <AuthProvider>
                  <QueryClientProvider client={queryClient}>
                    <App />
                  </QueryClientProvider>
                  <ToastContainer
                    hideProgressBar
                    position="bottom-left"
                    limit={2}
                    bodyClassName="toast__bodyClassName"
                    toastClassName="toast__className"
                    newestOnTop
                    closeButton={false}
                    autoClose={2000}
                  />
                </AuthProvider>
              </ConnectionProvider>
            </ConfirmProvider>
          </UIProvider>
        </WalletProvider>
      </ThemeProvider>,
      document.getElementById('root')
    );
  } else {
    ReactDOM.render(
      <ThemeProvider theme={theme}>
        <WalletProvider wallets={wallets} autoConnect>
          <UIProvider>
            <ConfirmProvider defaultOptions={materialConfirmOptions}>
              <ConnectionProvider>
                <AuthProvider>
                  <QueryClientProvider client={queryClient}>
                    <App />
                  </QueryClientProvider>
                  <ToastContainer
                    hideProgressBar
                    position="bottom-left"
                    limit={2}
                    bodyClassName="toast__bodyClassName"
                    toastClassName="toast__className"
                    newestOnTop
                    closeButton={false}
                    autoClose={2000}
                  />
                </AuthProvider>
              </ConnectionProvider>
            </ConfirmProvider>
          </UIProvider>
        </WalletProvider>
      </ThemeProvider>,
      document.getElementById('root')
    );
  }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
