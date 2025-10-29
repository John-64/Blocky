import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Loader2, Package, ShoppingBag, XCircle, CheckCircle2, ShoppingBasket } from "lucide-react";

interface Props {
  contract: ethers.Contract | null;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const StateMap: { [key: number]: string } = {
  0: "Attivo",
  1: "Venduto",
  2: "Completato",
  3: "In disputa",
  4: "Annullato",
};

export function MyTransactionsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-700 rounded-lg transition-colors focus:outline-none hover:ring-2 focus:ring-2 hover:ring-gray-400 focus:ring-gray-00 cursor-pointer"
      aria-label="Le mie operazioni"
      title="Le mie operazioni"
    >
      <ShoppingBag size={22} />
    </button>
  );
}

export default function MyTransactionsModal({ contract, showNotification }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
    loadData();
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = "unset";
  };

  const loadData = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const salesData = await contract.getMySales();
      const [salesIds, buyers, salesPrices, salesTitles, salesStates, soldAtsSales] = salesData;
      const parsedSales = salesIds.map((id: bigint, i: number) => ({
        id: id.toString(),
        buyer: buyers[i],
        price: ethers.formatEther(salesPrices[i]) + " ETH",
        title: salesTitles[i],
        state: Number(salesStates[i]),
        soldAt: Number(soldAtsSales[i]),
      }));
      setSales(parsedSales);

      const purchasesData = await contract.getMyPurchases();
      const [purchasesIds, sellers, purchasesPrices, purchasesTitles, purchasesStates, soldAtsPurchases] = purchasesData;
      const parsedPurchases = purchasesIds.map((id: bigint, i: number) => ({
        id: id.toString(),
        seller: sellers[i],
        price: ethers.formatEther(purchasesPrices[i]) + " ETH",
        title: purchasesTitles[i],
        state: Number(purchasesStates[i]),
        soldAt: Number(soldAtsPurchases[i]),
      }));
      setPurchases(parsedPurchases);
    } catch (err) {
      console.error("Errore nel caricare i propri annunci:", err);
      showNotification("Caricamento vendite/acquisti fallito.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: Function) => {
    try {
      const tx = await action();
      await tx.wait();
      showNotification("Azione completata!", 'success');
      await loadData(); // Ricarica i dati invece di reload della pagina
    } catch (err: any) {
      console.error("Azione fallita:", err);
      showNotification(err.reason || "Azione fallita.", 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const cancelListing = (id: string) =>
    handleAction(() => {
      setProcessingId(id);
      return contract!.cancelListing(id);
    });

  const releaseFunds = (id: string) =>
    handleAction(() => {
      setProcessingId(id);
      return contract!.releaseFunds(id);
    });

  const getStateColor = (state: number) => {
    switch (state) {
      case 0: return "bg-blue-50 border-blue-200";
      case 1: return "bg-yellow-50 border-yellow-200";
      case 2: return "bg-green-50 border-green-200";
      case 3: return "bg-orange-50 border-orange-200";
      case 4: return "bg-red-50 border-red-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const renderList = (items: any[], type: 'sales' | 'purchases') => (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.length === 0 ? (
        <p className="text-gray-500 col-span-full text-center py-6">
          Non ci sono ancora articoli qui!
        </p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className={`${getStateColor(
              item.state
            )} border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {item.title}
              </h3>
              {item.state === 0 && <Package size={18} className="text-blue-500" />}
              {item.state === 1 && <ShoppingBasket size={18} className="text-yellow-500" />}
              {item.state === 2 && <CheckCircle2 size={18} className="text-green-500" />}
              {item.state === 3 && <XCircle size={18} className="text-orange-500" />}
              {item.state === 4 && <XCircle size={18} className="text-red-500" />}
            </div>

            <p className="text-sm text-gray-600 mt-1">
              Prezzo: <span className="font-medium">{item.price}</span>
            </p>
            <p className="text-sm text-gray-600">
              Stato:{" "}
              <span className="font-semibold text-gray-800">
                {StateMap[item.state]}
              </span>
            </p>

            <div className="mt-4 flex justify-between items-center">
              {type === "sales" && item.state === 0 && (
                <button
                  onClick={() => cancelListing(item.id)}
                  disabled={processingId === item.id}
                  className="w-full py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 disabled:opacity-50 cursor-pointer"
                >
                  {processingId === item.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Annullamento...
                    </span>
                  ) : (
                    "Annulla"
                  )}
                </button>
              )}

              {type === "purchases" && item.state === 1 && (
                <button
                  onClick={() => releaseFunds(item.id)}
                  disabled={processingId === item.id}
                  className="w-full py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 disabled:opacity-50 cursor-pointer"
                >
                  {processingId === item.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Conferma...
                    </span>
                  ) : (
                    "Conferma ricezione"
                  )}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <MyTransactionsButton onClick={openModal} />

      {isOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto"
          style={{ minHeight: "100vh", minWidth: "100vw" }}
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Le mie operazioni</h2>
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

              <div className="flex justify-center mt-4 space-x-3">
                <button
                  onClick={() => setActiveTab("sales")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                    activeTab === "sales"
                      ? "bg-teal-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Vendite
                </button>
                <button
                  onClick={() => setActiveTab("purchases")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                    activeTab === "purchases"
                      ? "bg-teal-700 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Acquisti
                </button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                </div>
              ) : activeTab === "sales" ? (
                renderList(sales, "sales")
              ) : (
                renderList(purchases, "purchases")
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}