import { useState } from "react";
import logo from "../src/assets/logo-full.png";
import ConnectWallet from "./components/ConnectWallet";
import ProjectInfoPopup from './components/ProjectInfoPopup';
import ListingsList from "./components/ListingsList";
import CreateListing, { CreateListingButton } from "./components/CreateListing";
import MyListings from "./components/MyListings";
import Notification from "./components/Notification";
//import { useMarketplace } from "./hooks/useMarketplace";
import { useHardhatMarketplace } from "./hooks/useMarketplaceHardhat";
import { Search } from "lucide-react"

export default function App() {
  const { contract, account, connectWallet } = useHardhatMarketplace();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleActionSuccess = () => {
    showNotification("Operazione completata con successo!", 'success');
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      {notification && <Notification message={notification.message} type={notification.type} />}

      <div className="container mx-auto p-6">
        <header className="grid grid-cols-[15%_55%_30%] items-center mb-8 h-20">
          
          <div className="flex items-center justify-start w-max cursor-pointer">
            <a href="/"><img src={logo} alt="Blocky Logo" className="h-10" /></a>
          </div>

          <div className="relative w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />

            <input
              type="text"
              placeholder="Cerca qui gli articoli..."
              className="w-full pl-10 pr-3 py-3 bg-[#edf2f2] rounded-lg text-sm text-gray-700
                        focus:none focus:none focus:none outline-none
                        transition placeholder-gray-600"
              onChange={(e) => {
                const event = new CustomEvent("searchListings", { detail: e.target.value });
                window.dispatchEvent(event);
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <MyListings 
              contract={contract} 
              showNotification={showNotification} 
            />

            <CreateListing
              contract={contract}
              onCreateSuccess={handleActionSuccess}
              showNotification={showNotification}
            />

            <ConnectWallet account={account} connectWallet={connectWallet} />

            <ProjectInfoPopup />
          </div>
        </header>

        {account && contract ? (
          <main className="grid gap-8">
            <div className="lg:col-span-2 space-y-8">
                <ListingsList 
                    key={`listings-${refreshKey}`}
                    contract={contract} 
                    account={account} 
                    onPurchaseSuccess={handleActionSuccess} 
                    showNotification={showNotification} 
                />
            </div>
          </main>
        ) : (
          <div className="text-center p-12 bg-white rounded-xl shadow-lg mt-10">
            <h2 className="text-xl font-semibold text-gray-700">Connetti il tuo wallet per visualizzare il marketplace.</h2>
            <p className="text-gray-500 mt-2">Usa il pulsante in alto a destra per iniziare la sessione.</p>
          </div>
        )}
      </div>
    </div>
  );
}