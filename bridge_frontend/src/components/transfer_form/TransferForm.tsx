import { useState } from 'react';
import { useSignPersonalMessage, useCurrentAccount, useSuiClient} from '@mysten/dapp-kit';
import { ethers } from 'ethers';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';

const suiContractAddress="0xa7346de5cd782b80f3f65d4c7ea4cdff65c937cc48a0a03fecc2feef20c078bc";
const sebCoin = `${suiContractAddress}::seb_coin::SEB_COIN`;
const deployerAddress = "0x40fa97a9f0192450281a7c6b3477de0e059cb3cf7603722117245b89170e0de4";

type TransferFormProps = {
  ethAddress: string;
  suiAddress: string;
  suiBalance: number;
  ethBalance: number;
};

const truncateTo6Decimals = (value: number) => {
  return Math.floor(value * 1e6) / 1e6;
};

export default function TransferForm({ ethAddress, suiAddress,suiBalance, ethBalance }: TransferFormProps) {
  const [transferDirection, setTransferDirection] = useState<'SUI_TO_ETH' | 'ETH_TO_SUI'>('SUI_TO_ETH');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const suiClient = useSuiClient();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signAndExecuteTransaction} = useSignAndExecuteTransaction();
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
      const amountValue = truncateTo6Decimals(Number(amount));
      const amountIn6Decimals = amountValue * 1e6;

  
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
            amount: Number(amountValue).toFixed(6)
          }
        : {
            senderEthAddress: ethAddress,
            recipientSuiAddress: suiAddress,
            amount: Number(amountValue).toFixed(6)
          };

      const message = createMessage(baseBody);
      let signature;
      let txDigest: string | null = null;

      if (transferDirection === 'SUI_TO_ETH') {
        if (!currentAccount) throw new Error('Sui wallet not connected');

        if (currentAccount.address !== deployerAddress) {
          // in the SUI SebCoin Contract only the DEPLOYER is able to BURN coins

          // so if the USER trying to transfer from SUI(to burn it) is not the DEPLOYER
          // then he needs to send the coins to the deployer first
          // and then the deployer will burn the coins for him
          const coins = await suiClient.getCoins({
            owner: suiAddress!,
            coinType: sebCoin,
          });

          console.log('Coins:', coins);

          console.log("currentAccount : ", currentAccount);

          let burnCoinId = await handleCoinSelection(
            amountValue,
            coins.data
          );

          console.log('Burn coin ID:', burnCoinId);

          const splitTransferBurnTx = new Transaction();
          const coin = splitTransferBurnTx.object(burnCoinId);
          splitTransferBurnTx.moveCall({
            target: `${suiContractAddress}::seb_coin::split_and_transfer_for_burn`,
            arguments: [
                coin,
                splitTransferBurnTx.pure.address(deployerAddress),
                splitTransferBurnTx.pure.u64(amountIn6Decimals),
            ],
          });

          const result = await signAndExecuteTransaction({
            transaction: splitTransferBurnTx,
          });

          console.log('Split result:', result);

          txDigest = result.digest;
        }

        console.log('currentAccount SIGNING:', currentAccount);
        signature = await signPersonalMessage({
          message: new TextEncoder().encode(message)
        });
      } else {
        // sign with Ethereum
        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        const signer = provider.getSigner(ethAddress);
        console.log('signer:', signer.getAddress());
        signature = await signer.signMessage(message);
      }

      const body = {
        ...baseBody,
        message,
        signature,
        txDigest: txDigest || null
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

  const handleCoinSelection = async (
    amount: number,
    coins: CoinStruct[]
  ) => {
    const targetAmount = amount*1e6;
    let burnCoinId = "";
    
    // find a coin with enough balance
    let suitableCoin = coins.find(c => Number(c.balance) >= targetAmount);
    // find a coin with exact balance
    const suitableCoinExact = coins.find(c => Number(c.balance) === targetAmount);
    if (suitableCoinExact) {
        suitableCoin = suitableCoinExact;
    }

    if (!suitableCoin) {
      // if no coin has enough balance, merge coins until we have enough
      let totalBalance = 0;
      let coinsOverAmount = [];

      for (const coin of coins) {
          totalBalance += Number(coin.balance);
          coinsOverAmount.push(coin);
          if (totalBalance >= (targetAmount)) break;
      }

      const mergeTx = new Transaction();
      const primaryCoin = mergeTx.object(coinsOverAmount[0].coinObjectId);
      const coinsToMerge = coinsOverAmount.slice(1).map(c => mergeTx.object(c.coinObjectId));
      
      mergeTx.mergeCoins(primaryCoin, coinsToMerge);
      const mergeResult = await signAndExecuteTransaction({
        transaction: mergeTx,
      });

      console.log('Merge result:', mergeResult);
  
      await new Promise((resolve) => setTimeout(resolve, 3000));
      burnCoinId = coins[0].coinObjectId;
    } else {
      burnCoinId = suitableCoin.coinObjectId;
    }
  
    return burnCoinId;
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