// src/components/CreateListing.tsx
import { useState } from "react";
import { ethers } from "ethers";

interface Props {
  contract: ethers.Contract | null;
  onCreateSuccess: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function CreateListing({ contract, onCreateSuccess, showNotification }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("0"); // 0: New, 1: Good, etc.
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !title || !description || !price) {
      showNotification("Per favore, compila tutti i campi.", 'error');
      return;
    }

    setLoading(true);
    try {
      const priceInWei = ethers.parseEther(price);
      const tx = await contract.createListing(priceInWei, title, description, parseInt(condition));
      await tx.wait(); // Aspetta che la transazione sia minata
      
      onCreateSuccess();
      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setCondition("0");
    } catch (err: any) {
      console.error("Errore durante la creazione dell'annuncio:", err);
      showNotification(err.reason || "Creazione annuncio fallita.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Crea un Nuovo Annuncio</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrizione</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Prezzo (ETH)</label>
          <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} step="0.001" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" />
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condizione</label>
          <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2">
            <option value="0">Nuovo</option>
            <option value="1">Buono</option>
            <option value="2">Accettabile</option>
            <option value="3">Danneggiato</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition">
          {loading ? "Creazione in corso..." : "Pubblica Annuncio"}
        </button>
      </form>
    </div>
  );
}