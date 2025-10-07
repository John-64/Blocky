import { useEffect, useState } from "react";
import { 
  fetchActiveListings, 
  buyListing, 
  getConnectedAddress,
  type ListingDisplay 
} from "../contracts/marketplace";

export default function ListingList() {
  const [listings, setListings] = useState<ListingDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    loadListings();
    loadUserAddress();
  }, []);

  async function loadListings() {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchActiveListings();
      setListings(data);
      
      console.log(`✅ Caricati ${data.length} listing attivi`);
    } catch (err: any) {
      console.error("❌ Errore nel caricamento:", err);
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  async function loadUserAddress() {
    try {
      const address = await getConnectedAddress();
      setUserAddress(address.toLowerCase());
    } catch (err) {
      console.error("Errore nel recupero indirizzo:", err);
    }
  }

  async function handleBuy(listing: ListingDisplay) {
    if (!window.confirm(`Confermi l'acquisto di questo articolo per ${listing.price} ETH?`)) {
      return;
    }

    try {
      setBuyingId(listing.id);
      await buyListing(listing.id, listing.priceWei);
      
      alert("✅ Acquisto completato!");
      
      // Ricarica i listing
      await loadListings();
    } catch (err: any) {
      console.error("❌ Errore nell'acquisto:", err);
      alert(`Errore: ${err.message}`);
    } finally {
      setBuyingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Caricamento listing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">❌ Errore</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadListings}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Blocky 🧊</h1>
        <p className="text-gray-600">
          Listing attivi: <span className="font-semibold">{listings.length}</span>
        </p>
        {userAddress && (
          <p className="text-sm text-gray-500 mt-1">
            Connesso: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </p>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-2">📭 Nessun listing disponibile</p>
          <p className="text-gray-400 text-sm">Crea il primo listing per iniziare!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const isOwnListing = userAddress === listing.seller.toLowerCase();
            const isBuying = buyingId === listing.id;

            return (
              <div 
                key={listing.id}
                className="border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-white"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">Listing #{listing.id}</h3>
                    {listing.disputed && (
                      <span className="bg-red-500 text-xs px-2 py-1 rounded">
                        ⚠️ Disputa
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Metadata */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Metadata URI:</p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                      {listing.metadataURI}
                    </p>
                  </div>

                  {/* Prezzo */}
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-blue-600">
                      {listing.price} <span className="text-lg">ETH</span>
                    </p>
                  </div>

                  {/* Info aggiuntive */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Seller:</span>
                      <span className="font-mono text-xs">
                        {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeout:</span>
                      <span className="font-semibold">{listing.timeoutDays} giorni</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Creato:</span>
                      <span>{listing.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex gap-2 mb-4">
                    {listing.isActive && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                        ✓ Disponibile
                      </span>
                    )}
                    {listing.sold && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                        ✗ Venduto
                      </span>
                    )}
                    {listing.cancelled && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        Cancellato
                      </span>
                    )}
                  </div>

                  {/* Azioni */}
                  {listing.isActive && (
                    <button
                      onClick={() => handleBuy(listing)}
                      disabled={isOwnListing || isBuying}
                      className={`w-full py-2 rounded font-semibold transition ${
                        isOwnListing
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : isBuying
                          ? "bg-blue-400 text-white cursor-wait"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isOwnListing 
                        ? "🚫 Tuo listing" 
                        : isBuying 
                        ? "⏳ Acquisto in corso..."
                        : "💳 Acquista ora"
                      }
                    </button>
                  )}

                  {isOwnListing && listing.isActive && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      💡 Non puoi comprare i tuoi listing
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pulsante ricarica */}
      <div className="mt-8 text-center">
        <button
          onClick={loadListings}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition"
        >
          🔄 Ricarica listing
        </button>
      </div>
    </div>
  );
}