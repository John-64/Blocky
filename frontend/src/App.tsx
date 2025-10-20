import { useState } from "react";
import logo from "../src/assets/logo-full.png";
import ConnectWallet from "./components/ConnectWallet.tsx";
import ListingsList from "./components/ListingsList.tsx";
import CreateListing from "./components/CreateListing.tsx";
import MyListings from "./components/MyListings.tsx";
import Notification from "./components/Notification.tsx";
//import { useMarketplace } from "./hooks/useMarketplace";
import { useHardhatMarketplace } from "./hooks/useMarketplaceHardhat";

export default function App() {
  const { contract, account, connectWallet } = useHardhatMarketplace();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Chiave per forzare il re-render di liste dopo un'azione (es. acquisto, creazione)
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
    <div className="min-h-screen bg-gray-50">
      {notification && <Notification message={notification.message} type={notification.type} />}

      <div className="container mx-auto p-6">
        <header className="flex justify-between items-center mb-8">
            <img src={logo} alt="Blocky Logo" className="w-40" />

            {/* Passa account e la funzione di connessione all'hook */}
            <div className="flex items-center justify-center">
              <ConnectWallet account={account} connectWallet={connectWallet} /> 
            </div>
        </header>

        {account && contract ? (
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonna principale: Lista Annunci Attivi */}
            <div className="lg:col-span-2 space-y-8">
                <ListingsList 
                    key={`listings-${refreshKey}`} // Forza re-render
                    contract={contract} 
                    account={account} 
                    onPurchaseSuccess={handleActionSuccess} 
                    showNotification={showNotification} 
                />
            </div>
            
            {/* Colonna laterale: Creazione Annuncio e I Miei Annunci */}
            <div className="space-y-8">
                <CreateListing 
                    contract={contract} 
                    onCreateSuccess={handleActionSuccess} 
                    showNotification={showNotification} 
                />
                <MyListings 
                    key={`my-listings-${refreshKey}`} // Forza re-render
                    contract={contract} 
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