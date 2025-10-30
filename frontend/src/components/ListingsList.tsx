import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Loader2, Tag, User, Clock } from "lucide-react";

interface Props {
  contract: ethers.Contract | null;
  account: string | null;
  onPurchaseSuccess: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

interface Listing {
  id: string;
  seller: string;
  price: string;
  priceInWei: bigint;
  title: string;
  description: string;
  condition: string;
  createdAt: string;
}

export default function ListingsList({ contract, account, onPurchaseSuccess, showNotification }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    const checkContract = async () => {
      if (!contract) return;

      try {
        const code = await contract.runner?.provider?.getCode(contract.target);
        if (!code || code === "0x") {
          showNotification("Contratto non trovato. Verifica l'indirizzo e la rete.", "error");
          return;
        }

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
        const [ids, sellers, buyers, prices, titles, descriptions, conditions, createdAts] = await contract.getActiveListings();

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

        const listingsForDisplay = parsed.filter(listing => 
            account ? listing.seller.toLowerCase() !== account.toLowerCase() : true
        );
        
        setListings(listingsForDisplay);
        setFiltered(listingsForDisplay);
      } catch (err) {
        console.error("Errore durante il caricamento degli annunci:", err);
        showNotification("Caricamento annunci fallito.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (contract) loadListings();
  }, [contract]);

  useEffect(() => {
    const handler = (e: any) => {
      const query = e.detail.toLowerCase();
      setSearch(query);
      setFiltered(
        listings.filter(
          (l) =>
            l.title.toLowerCase().includes(query) ||
            l.description.toLowerCase().includes(query) ||
            l.seller.toLowerCase().includes(query)
        )
      );
    };

    window.addEventListener("searchListings", handler);
    return () => window.removeEventListener("searchListings", handler);
  }, [listings]);


  const handlePurchase = async (listing: Listing) => {
    if (!contract) return;
    setPurchasingId(listing.id);
    try {
      await contract.purchaseListing.staticCall(listing.id, {
        value: listing.priceInWei,
      });

      const tx = await contract.purchaseListing(listing.id, {
        value: listing.priceInWei,
      });
      await tx.wait();
      onPurchaseSuccess();
      showNotification("Acquisto completato con successo!", "success");
    } catch (err: any) {
      console.error("Errore durante l'acquisto:", err);
      showNotification(err.reason || "Acquisto fallito.", "error");
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-6">
          Nessun annuncio trovato{search ? " per questa ricerca." : " al momento."}
        </p>
      ) : (
        <div className="grid gap-6">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-black mb-2 flex items-center gap-2">
                  <Tag size={18} /> {l.title}
                </h3>
                <p className="text-gray-700 text-sm mb-3 line-clamp-3">{l.description}</p>

                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Condizione:</strong> {l.condition}
                  </p>
                  <p>
                    <strong>Prezzo:</strong>{" "}
                    <span className="text-green-600 font-medium">{l.price}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <User size={14} /> {l.seller}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={14} /> {l.createdAt}
                  </p>
                </div>
              </div>

              {account && account.toLowerCase() !== l.seller.toLowerCase() && (
                <button
                  onClick={() => handlePurchase(l)}
                  disabled={purchasingId === l.id}
                  className="mt-4 w-full py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-teal-300 transition text-sm font-medium cursor-pointer"
                >
                  {purchasingId === l.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Acquisto in corso...
                    </span>
                  ) : (
                    "Acquista"
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
