import { useState } from 'react';
import { useSignPersonalMessage, useCurrentAccount } from '@mysten/dapp-kit';
import { ethers } from 'ethers';

type TransferFormProps = {
  ethAddress: string;
  suiAddress: string;
  suiBalance: number;
  ethBalance: number;
};

export default function TransferForm({ ethAddress, suiAddress,suiBalance, ethBalance }: TransferFormProps) {
  const [transferDirection, setTransferDirection] = useState<'SUI_TO_ETH' | 'ETH_TO_SUI'>('SUI_TO_ETH');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const currentAccount = useCurrentAccount();

  const createMessage = (body: any) => {
    return transferDirection === 'SUI_TO_ETH' 
      ? `Bridge ${amount} SUI to ETH\nSender: ${body.senderSuiAddress}\nRecipient: ${body.recipientEthAddress}\nDate: ${Date.now()}`
      : `Bridge ${amount} ETH to SUI\nSender: ${body.senderEthAddress}\nRecipient: ${body.recipientSuiAddress}\nDate: ${Date.now()}`;
  };

  const handleSend = async () => {
    setStatusMessage(null);
    setIsError(false);

    if (!amount || Number(amount) <= 0) {
      setStatusMessage('Please enter a valid amount');
      setIsError(true);
      return;
    }

    if (!ethAddress || !suiAddress) {
      setStatusMessage('Please connect both wallets first');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const amountValue = Number(amount);
  
      if (transferDirection === 'SUI_TO_ETH') {
        if (amountValue > suiBalance) {
          setStatusMessage('Insufficient SUI balance');
          setIsError(true);
          return;
        }
      } else {

        if (amountValue > ethBalance) {
          setStatusMessage('Insufficient ETH balance');
          setIsError(true);
          return;
        }
      }

      const endpoint = transferDirection === 'SUI_TO_ETH' 
        ? 'http://localhost:3000/api/bridge/sui-to-eth'
        : 'http://localhost:3000/api/bridge/eth-to-sui';

      const baseBody = transferDirection === 'SUI_TO_ETH'
        ? {
            senderSuiAddress: suiAddress,
            recipientEthAddress: ethAddress,
            amount: Number(amount).toFixed(6)
          }
        : {
            senderEthAddress: ethAddress,
            recipientSuiAddress: suiAddress,
            amount: Number(amount).toFixed(6)
          };

      const message = createMessage(baseBody);
      let signature;

      if (transferDirection === 'SUI_TO_ETH') {
        // sign with Sui
        if (!currentAccount) throw new Error('Sui wallet not connected');
        signature = await signPersonalMessage({
          message: new TextEncoder().encode(message)
        });
      } else {
        // sign with Ethereum
        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        const signer = provider.getSigner();
        signature = await signer.signMessage(message);
      }

      const body = {
        ...baseBody,
        message,
        signature
      };

      console.log('Bridge request body:', body);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || (
        result.message !== "SUI to ETH bridge successful" && 
        result.message !== "ETH to SUI bridge successful"
      )) {
        throw new Error(result.message || 'Bridge request failed');
      }

      setStatusMessage(result.message);
      setIsError(false);
      setAmount('');
    } catch (error: any) {
      console.error('Transfer error:', error);
      setStatusMessage(error.message || 'Transfer failed');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="transfer-form-container">
      <h2>Transfer</h2>
      <div className="transfer-direction">
        <button
          className={transferDirection === 'SUI_TO_ETH' ? 'active' : ''}
          onClick={() => {
            setTransferDirection('SUI_TO_ETH');
            setStatusMessage(null);
          }}
        >
          SUI to ETH
        </button>
        <button
          className={transferDirection === 'ETH_TO_SUI' ? 'active' : ''}
          onClick={() => {
            setTransferDirection('ETH_TO_SUI');
            setStatusMessage(null);
          }}
        >
          ETH to SUI
        </button>
      </div>
      <input
        className="amount-input"
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.001"
      />
      <button 
        className="send-button" 
        onClick={handleSend}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Send'}
      </button>
      
      {statusMessage && (
        <div className={`status-message ${isError ? 'status-error' : 'status-success'}`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}