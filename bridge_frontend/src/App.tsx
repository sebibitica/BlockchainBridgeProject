import { useState } from 'react';
import './App.css';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { darkTheme } from './myTheme';
import SuiWallet from './SuiWallet';
import ETHWallet from './ETHWallet';
import TransferForm from './TransferForm.tsx';

const { networkConfig } = createNetworkConfig({
	localnet: { url: getFullnodeUrl('localnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
});
const queryClient = new QueryClient();

function App() {
  const [ethAddress, setEthAddress] = useState('');
  const [suiAddress, setSuiAddress] = useState('');
  const [suiBalance, setBalanceSui] = useState(0);
  const [ethBalance, setBalanceEth] = useState(0);

  return (
    <div className="app-container">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="localnet">
          <WalletProvider theme={darkTheme}>
              <SuiWallet onAddressChange={setSuiAddress} onBalanceChange={setBalanceSui}/>
              <TransferForm ethAddress={ethAddress} suiAddress={suiAddress} suiBalance={suiBalance} ethBalance={ethBalance}/>
              <ETHWallet onAddressChange={setEthAddress} onBalanceChange={setBalanceEth}/>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
