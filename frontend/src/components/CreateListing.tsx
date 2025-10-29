// src/components/CreateListing.tsx
import { useState } from "react";
import { ethers } from "ethers";
import { PlusCircle } from "lucide-react";

interface Props {
  contract: ethers.Contract | null;
  onCreateSuccess: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

/** 🔹 Bottone riutilizzabile per aprire il modal di creazione */
export function CreateListingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-600 cursor-pointer">
      Crea annuncio
    </button>
  );
}

/** 🔹 Modal di creazione annuncio */
export default function CreateListing({ contract, onCreateSuccess, showNotification }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("0");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setCondition("0");
  };

  const closeModal = () => {
    setIsOpen(false);
    resetForm();
    document.body.style.overflow = "unset";
  };

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !title || !description || !price) {
      showNotification("Per favore, compila tutti i campi.", "error");
      return;
    }

    setLoading(true);
    try {
      const priceInWei = ethers.parseEther(price);
      const safeTitle = title.slice(0, 100);
      const safeDescription = description.slice(0, 500);

      const tx = await contract.createListing(
        priceInWei,
        safeTitle,
        safeDescription,
        parseInt(condition),
        { gasLimit: 500000 }
      );

      await tx.wait();

      onCreateSuccess();
      closeModal();
      showNotification("Annuncio creato con successo!", "success");
    } catch (err: any) {
      console.error("Errore durante la creazione dell'annuncio:", err);
      const reason = err?.reason || err?.error?.data?.message || "Creazione annuncio fallita.";
      showNotification(reason, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <>
      <CreateListingButton onClick={openModal} />

      {isOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto"
          style={{ minHeight: "100vh", minWidth: "100vw" }}
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-800">Inserisci i dettagli</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition p-1 cursor-pointer"
                disabled={loading}
                aria-label="Chiudi"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Titolo*
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. iPhone 13 Pro Max 256GB"
                  className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 transition"
                  disabled={loading}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100 caratteri</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrizione*
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrivi l'oggetto in vendita..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 transition resize-none"
                  disabled={loading}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/500 caratteri</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
                    Prezzo (ETH)*
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.001"
                    step="0.000001"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg h-10 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-semibold text-gray-700 mb-2">
                    Condizione*
                  </label>
                  <select
                    id="condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg shadow-sm h-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 transition cursor-pointer"
                    disabled={loading}
                  >
                    <option value="0">Nuovo</option>
                    <option value="1">Buono</option>
                    <option value="2">Accettabile</option>
                    <option value="3">Danneggiato</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed transition font-semibold shadow-md cursor-pointer"
                >
                  {loading ? "Pubblicazione..." : "Pubblica annuncio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
