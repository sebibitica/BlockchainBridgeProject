import { useState, useEffect } from 'react';
import { useAccounts, useCurrentAccount, ConnectModal, useSuiClient, useDisconnectWallet, useSwitchAccount } from '@mysten/dapp-kit';
import '@mysten/dapp-kit/dist/index.css';
import { WalletAccount } from '@wallet-standard/base';

import suiLogo from '../../assets/sui.svg';

const suiContractAddress="0xa7346de5cd782b80f3f65d4c7ea4cdff65c937cc48a0a03fecc2feef20c078bc";
const sebCoin = `${suiContractAddress}::seb_coin::SEB_COIN`;

type CoinBalance = {
  totalBalance: string;
};

type SuiWalletProps = {
  onAddressChange: (address: string) => void;
  onBalanceChange: (balance: number) => void;
}

const formatBalance = (balance: string | number): number => Number(balance) / 1e6;

function SuiWallet({ onAddressChange, onBalanceChange }: SuiWalletProps): JSX.Element {
  const accounts = useAccounts();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: switchAccount } = useSwitchAccount();

  useEffect(() => {
    if (currentAccount?.address) {
      onAddressChange(currentAccount.address);
    }
  }, [currentAccount?.address]);

  const fetchBalance = async (address: string) => {
    try {
      const balanceResponse: CoinBalance = await suiClient.getBalance({
        owner: address,
        coinType: sebCoin,
      });
      
      console.log('Address: ', address);
      console.log('Balance Response: ', balanceResponse);
      
      const totalBalance = formatBalance(balanceResponse.totalBalance);
      
      console.log('Total Balance: ', totalBalance);
      onBalanceChange(totalBalance);
      setBalance(totalBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  useEffect(() => {
    if (selectedAddress) {
      fetchBalance(selectedAddress);
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (currentAccount) {
      setSelectedAddress(currentAccount.address);
    }
  }, [currentAccount]);

  const handleCopyAddress = () => {
    if (selectedAddress) {
      navigator.clipboard.writeText(selectedAddress);
      alert('Address copied to clipboard!');
    }
  };

  const handleAccountChange = (account: WalletAccount) => {
    switchAccount({ account });
    setSelectedAddress(account.address);
    fetchBalance(account.address);
    onAddressChange(account.address);
  };

  const handleRefresh = () => {
    if (selectedAddress) {
      setIsRefreshing(true);
      fetchBalance(selectedAddress);
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="wallet-container">
      <h2 style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src={suiLogo} 
          alt="SUI Logo" 
          style={{ width: '30px', height: '30px', marginRight: '10px' }} 
        />
        SUI WALLET
      </h2>

      {!currentAccount && (
        <ConnectModal
          trigger={
            <button className="connect-button"
            >
              Connect
            </button>
          }
        />
      )}

      {accounts && accounts.length > 0 && (
        <>
          <button
            style={{
              padding: '10px 20px',
              fontSize: '10px',
              fontWeight: 400,
              color: '#f3f3f5',
              backgroundColor: '#17252A',
              borderRadius: '8px',
              border: '1px solid #17252A',
              boxShadow: '0px 4px 12px rgba(22, 61, 109, 0.1)',
              cursor: 'pointer',
              marginBottom: '10px',
            }}
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
          <div style={{ display: 'flex', alignItems: 'center' }}>
          <select
            className="address-dropdown"
            value={selectedAddress || ''}
            onChange={(e) => {
              const selectedAccount = accounts.find(
                (account) => account.address === e.target.value
              );
              if (selectedAccount) {
                handleAccountChange(selectedAccount);
              }
            }}
            style={{ marginRight: '10px' }}
          >
            {accounts.map((account) => (
              <option key={account.address} value={account.address}>
                {account.address}
              </option>
            ))}
          </select>
            <button
              onClick={handleCopyAddress}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#f3f3f5',
                backgroundColor: '#17252A',
                borderRadius: '8px',
                border: '1px solid #17252A',
                boxShadow: '0px 4px 12px rgba(22, 61, 109, 0.1)',
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
          </div>
          <div className="balance-display">
            BALANCE: {balance.toFixed(6)} SEB
            <button
              onClick={handleRefresh}
              className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#f3f3f5',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="refresh-icon"
                style={{
                  width: '20px',
                  height: '20px',
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              >
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0114.89-3.36L23 10M1 14l4.6 4.6A9 9 0 0020.49 15"></path>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SuiWallet;
