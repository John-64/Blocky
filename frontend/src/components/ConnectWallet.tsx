import { useState, useRef, useEffect } from 'react';

interface Props {
  account: string | null;
  connectWallet: () => Promise<void>;
}

export default function ConnectWallet({ account, connectWallet }: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayAccount = account 
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` 
    : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const copyToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account);
    }
  };

  return (
    <div className="relative flex justify-center align-center" ref={dropdownRef}>
      {account ? (
        <>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-orange-400 transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
              alt="MetaMask Avatar"
              className="w-full h-full object-cover bg-white p-1"
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-10 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Account connesso</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm text-gray-800">{displayAccount}</p>
                </div>
              </div>
              
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Connesso a Hardhat</span>
                </div>
                <p className="text-xs text-gray-400">Network: localhost:8545</p>
              </div>

              <div className="border-t border-gray-100 px-4 py-2 relative">
                <div className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2 transition">
                  Copia indirizzo completo

                  <button
                    onClick={copyToClipboard}
                    className="ml-2 text-gray-400 hover:text-gray-600 transition cursor-pointer absolute right-4 top-1/2 -translate-y-1/2"
                    title="Copia indirizzo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={connectWallet}
          className="font-mono px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
        >
          Collega Wallet
        </button>
      )}
    </div>
  );
}