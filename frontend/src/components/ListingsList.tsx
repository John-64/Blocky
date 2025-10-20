// src/components/ListingsList.tsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";

interface Props {
  contract: ethers.Contract | null;
  account: string | null;
  onPurchaseSuccess: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

interface Listing {
  id: string;
  seller: string;
  price: string; // Formattato come "0.1 ETH"
  priceInWei: bigint;
  title: string;
  description: string;
  condition: string;
  createdAt: string;
}

export default function ListingsList({ contract, account, onPurchaseSuccess, showNotification }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    const checkContract = async () => {
      if (!contract) return;
      
      try {
        // Verifica che il contratto esista
        const code = await contract.runner?.provider?.getCode(contract.target);
        console.log("Contract code length:", code?.length);
        
        if (!code || code === '0x') {
          console.error("⚠️ Il contratto non è deployato a questo indirizzo!");
          showNotification("Contratto non trovato. Verifica l'indirizzo e la rete.", 'error');
          return;
        }
        
        // Verifica il listingCount
        const count = await contract.listingCount();
        console.log("Listing count:", count.toString());
        
      } catch (err) {
        console.error("Errore verifica contratto:", err);
      }
    };
    
    checkContract();
  }, [contract]);

  useEffect(() => {
    const loadListings = async () => {
      if (!contract) return;
      try {
        setLoading(true);
        // La tua funzione getActiveListings restituisce un array di array, non un oggetto
        console.log("Ok1");
        const [ ids, sellers, buyers, prices, titles, descriptions, conditions, createdAts, soldAts, states ] = await contract.getActiveListings();
        console.log("Ok2");

        const parsed: Listing[] = ids.map((id: bigint, i: number) => ({
          id: id.toString(),
          seller: sellers[i],
          price: ethers.formatEther(prices[i]) + " ETH",
          priceInWei: prices[i],
          title: titles[i],
          description: descriptions[i],
          condition: ["Nuovo", "Buono", "Accettabile", "Danneggiato"][Number(conditions[i])],
          createdAt: new Date(Number(createdAts[i]) * 1000).toLocaleString(),
        }));
        setListings(parsed);
      } catch (err) {
        console.error("Errore durante il caricamento degli annunci:", err);
        showNotification("Caricamento annunci fallito.", 'error');
      } finally {
        setLoading(false);
      }
    };

    if (contract) loadListings();
  }, [contract]);

  const handlePurchase = async (listing: Listing) => {
    if (!contract) return;
    setPurchasingId(listing.id);
    try {
      // Simula la chiamata prima di inviarla
      await contract.purchaseListing.staticCall(listing.id, {
        value: listing.priceInWei,
      });
      
      const tx = await contract.purchaseListing(listing.id, {
        value: listing.priceInWei,
      });
      await tx.wait();
      onPurchaseSuccess();
    } catch (err: any) {
      console.error("Errore durante l'acquisto:", err);
      showNotification(err.reason || "Acquisto fallito.", 'error');
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Annunci Attivi</h2>
      {loading ? (
        <p className="text-gray-500">Caricamento in corso...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">Nessun annuncio attivo al momento.</p>
      ) : (
        <ul className="space-y-4">
          {listings.map((l) => (
            <li key={l.id} className="border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg mb-1 text-blue-700">{l.title}</h3>
                  <p className="text-gray-700 mb-2">{l.description}</p>
                  <p><strong>ID:</strong> {l.id}</p>
                  <p><strong>Condizione:</strong> {l.condition}</p>
                  <p><strong>Prezzo:</strong> <span className="font-semibold text-green-600">{l.price}</span></p>
                  <p className="text-sm"><strong>Venditore:</strong> {l.seller}</p>
                  <p className="text-xs text-gray-500 mt-2">Pubblicato il: {l.createdAt}</p>
                </div>
                {account && account.toLowerCase() !== l.seller.toLowerCase() && (
                  <button
                    onClick={() => handlePurchase(l)}
                    disabled={purchasingId === l.id}
                    className="ml-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-green-300 transition self-center"
                  >
                    {purchasingId === l.id ? "Processando..." : "Acquista"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}