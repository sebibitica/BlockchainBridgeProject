import { useState } from 'react';
import './App.css';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { darkTheme } from './myTheme';
import SuiWallet from './components/wallets/SuiWallet.tsx';
import ETHWallet from './components/wallets/ETHWallet.tsx';
import TransferForm from './components/transfer_form/TransferForm.tsx';
import Quiz from './components/extra_quiz_option/Quiz.tsx';

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
  const [showSuiQuiz, setShowSuiQuiz] = useState(false);
  const [showEthQuiz, setShowEthQuiz] = useState(false);

  return (
    <div className="app-container">
      <div className="quiz-buttons">
        <button onClick={() => setShowSuiQuiz(true)}>Get SEB on SUI</button>
        <button onClick={() => setShowEthQuiz(true)}>Get SEB on ETH</button>
      </div>

      {showSuiQuiz && (
        <Quiz
          chain="SUI"
          ethAddress={ethAddress}
          suiAddress={suiAddress}
          onComplete={() => setShowSuiQuiz(false)}
          onClose={() => setShowSuiQuiz(false)}
        />
      )}

      {showEthQuiz && (
        <Quiz
          chain="ETH"
          ethAddress={ethAddress}
          suiAddress={suiAddress}
          onComplete={() => setShowEthQuiz(false)}
          onClose={() => setShowEthQuiz(false)}
        />
      )}
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
