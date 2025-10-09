interface Props {
  account: string | null;
  connectWallet: () => Promise<void>;
}

export default function ConnectWallet({ account, connectWallet }: Props) {
  const displayAccount = account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : null;
  
  return (
    <div className="flex">
      {account ? (
        <p className="text-sm text-gray-600 border border-green-500 bg-green-50 p-2 rounded-full px-4">
          Connesso: <span className="font-mono font-medium text-green-700">{displayAccount}</span>
        </p>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition shadow-md"
        >
          Connetti Wallet
        </button>
      )}
    </div>
  );
}