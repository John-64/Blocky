import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Loader2, Package, ShoppingBag, XCircle, CheckCircle2 } from "lucide-react";

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

export default function MyListings({ contract, showNotification }: Props) {
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
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
    loadData();
  }, [contract]);

  const handleAction = async (action: Function) => {
    try {
      const tx = await action();
      await tx.wait();
      showNotification("Azione completata!", 'success');
      window.location.reload();
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
       // Attivo
      case 0:
        return "bg-blue-50 border-blue-200";
      // In attesa
      case 1:
        return "bg-yellow-50 border-yellow-200";
      // Completato
      case 2:
        return "bg-green-50 border-green-200";
      // In disputa
      case 3:
        return "bg-orange-50 border-orange-200"; 
      // Annullato
      case 4:
        return "bg-red-50 border-red-200"; 
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const renderList = (items: any[], type: 'sales' | 'purchases') => (
    <div className="grid gap-4 mt-6 sm:grid-cols-2">
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
              {item.state === 1 && (
                <ShoppingBag size={18} className="text-yellow-500" />
              )}
              {item.state === 2 && (
                <CheckCircle2 size={18} className="text-green-500" />
              )}
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
    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">
        Le mie operazioni
      </h2>

      <div className="flex justify-center mb-4 space-x-3">
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
            activeTab === "sales"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Vendite
        </button>
        <button
          onClick={() => setActiveTab("purchases")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
            activeTab === "purchases"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Acquisti
        </button>
      </div>

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
  );
}
