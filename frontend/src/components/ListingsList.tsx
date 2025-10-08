import { useState, useEffect } from "react";
import { ethers } from "ethers";

interface Props {
  contract: ethers.Contract | null;
}

interface Listing {
  id: string;
  seller: string;
  buyer: string;
  price: string;
  title: string;
  description: string;
  condition: string;
  createdAt: string;
  state: number;
}

export default function ListingsList({ contract }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const listingsData = await contract.getActiveListings();
      const [
        ids,
        sellers,
        buyers,
        prices,
        titles,
        descriptions,
        conditions,
        createdAts,
        states,
      ] = listingsData;

      const parsed: Listing[] = ids.map((id: bigint, i: number) => ({
        id: id.toString(),
        seller: sellers[i],
        buyer: buyers[i],
        price: ethers.formatEther(prices[i]) + " ETH",
        title: titles[i],
        description: descriptions[i],
        condition: ["Nuovo", "Come nuovo", "Usato", "Danneggiato"][
          Number(conditions[i])
        ],
        createdAt: new Date(Number(createdAts[i]) * 1000).toLocaleString(),
        state: Number(states[i]),
      }));

      setListings(parsed);
    } catch (err) {
      console.error("Errore durante il caricamento degli annunci:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (contract) loadListings();
  }, [contract]);

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-3">Annunci Attivi</h2>

      {loading ? (
        <p className="text-gray-500">Caricamento in corso...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">Nessun annuncio attivo.</p>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => (
            <li
              key={l.id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-bold text-lg mb-1">{l.title}</h3>
              <p className="text-gray-700 mb-2">{l.description}</p>
              <p>
                <strong>Id:</strong> {l.id}
              </p>
              <p>
                <strong>Condizione:</strong> {l.condition}
              </p>
              <p>
                <strong>Prezzo:</strong> {l.price}
              </p>
              <p>
                <strong>Venditore:</strong> {l.seller}
              </p>
              <p className="text-sm text-gray-500">
                Pubblicato il: {l.createdAt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}