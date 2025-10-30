import { useState } from "react";
import { ethers } from "ethers";
import { Loader2, AlertTriangle, Package, ShoppingBag, XCircle, CheckCircle2, ShoppingBasket, ShieldCheck } from "lucide-react";

interface Props {
  contract: ethers.Contract | null;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const StateMap: { [key: number]: string } = {
  0: "Annuncio in vendita",
  1: "In attesa di conferma",
  2: "Vendita completata",
  3: "Disputa in corso",
  4: "Venduto con rimborso parziale",
  5: "Vendita annullata",
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
  const [refundAmounts, setRefundAmounts] = useState<{ [key: string]: string }>({});

  const DISPUTE_RESOLUTION_PERIOD_MINUTES = 30;

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
      const [salesIds, buyers, salesPrices, salesTitles, salesStates, soldAtsSales, disputeOpenedAtsSales, partialRefundOffersSales] = salesData;
      const parsedSales = salesIds.map((id: bigint, i: number) => ({
        id: id.toString(),
        buyer: buyers[i],
        price: ethers.formatEther(salesPrices[i]),
        title: salesTitles[i],
        state: Number(salesStates[i]),
        soldAt: Number(soldAtsSales[i]),
        disputeOpenedAt: Number(disputeOpenedAtsSales[i]),
        partialRefundOffer: ethers.formatEther(partialRefundOffersSales[i]),
      }));
      setSales(parsedSales);

      const purchasesData = await contract.getMyPurchases();
      const [purchasesIds, sellers, purchasesPrices, purchasesTitles, purchasesStates, soldAtsPurchases, disputeOpenedAtsPurchases, partialRefundOffersPurchases] = purchasesData;
      const parsedPurchases = purchasesIds.map((id: bigint, i: number) => ({
        id: id.toString(),
        seller: sellers[i],
        price: ethers.formatEther(purchasesPrices[i]),
        title: purchasesTitles[i],
        state: Number(purchasesStates[i]),
        soldAt: Number(soldAtsPurchases[i]),
        disputeOpenedAt: Number(disputeOpenedAtsPurchases[i]),
        partialRefundOffer: ethers.formatEther(partialRefundOffersPurchases[i]),
      }));
      setPurchases(parsedPurchases);
    } catch (err) {
      console.error("Errore nel caricare i propri annunci:", err);
      showNotification("Caricamento vendite/acquisti fallito.", 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAction = async (action: Function, id: string) => {
    setProcessingId(id);
    try {
      const tx = await action();
      await tx.wait();
      showNotification("Azione completata!", 'success');
      await loadData();
    } catch (err: any) {
      console.error("Azione fallita:", err);
      const errorMessage = err.reason || "Azione fallita. Controlla la console per i dettagli.";
      showNotification(errorMessage, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const cancelListing = (id: string) => handleAction(() => contract!.cancelListing(id), id);
  const releaseFunds = (id: string) => handleAction(() => contract!.releaseFunds(id), id);
  const openDispute = (id: string) => handleAction(() => contract!.openDispute(id), id);
  const acceptPartialRefund = (id: string) => handleAction(() => contract!.acceptPartialRefund(id), id);
  const resolveDispute = (id: string) => handleAction(() => contract!.resolveDispute(id), id);

  const offerPartialRefund = (id: string, amount: string) => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showNotification("Inserisci un importo valido per il rimborso.", 'error');
      return;
    }
    const amountInWei = ethers.parseEther(amount);
    handleAction(() => contract!.offerPartialRefund(id, amountInWei), id);
  };

  const getStateColor = (state: number) => {
    switch (state) {
      case 0: return "bg-blue-50 border-blue-200"; // In vendita
      case 1: return "bg-teal-700/10 border-teal-500/30"; //Acquisto/venduto
      case 2: return "bg-teal-700/10 border-teal-500/30"; // Trasferimento completato
      case 3: return "bg-red-400/20 border-red-300"; // In disputa
      case 4: return "bg-teal-700/10 border-teal-500/30"; // Venduto con rimborso parziale
      case 5: return "bg-red-400/20 border-red-300";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const renderList = (items: any[], type: 'sales' | 'purchases') => (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.length === 0 ? (
        <p className="text-gray-500 col-span-full text-center py-6">Non ci sono ancora articoli qui!</p>
      ) : (
        items.map((item) => {
          const isDisputeResolutionPeriodOver = item.disputeOpenedAt > 0 && (Date.now() / 1000) > (item.disputeOpenedAt + DISPUTE_RESOLUTION_PERIOD_MINUTES * 60);
          const hasOffer = parseFloat(item.partialRefundOffer) > 0;

          return (
            <div key={item.id} className={`${getStateColor(item.state)} border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between`}>
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 truncate pr-2">{item.title}</h3>
                  {item.state === 0 && <Package size={18} className="text-blue-500" />}
                  {item.state === 1 && <ShoppingBasket size={18} className="text-teal-500" />}
                  {item.state === 2 && <CheckCircle2 size={18} className="text-teal-500" />}
                  {item.state === 3 && <AlertTriangle size={18} className="text-red-500" />}
                  {item.state === 4 && <ShieldCheck size={18} className="text-teal-500" />}
                  {item.state === 5 && <XCircle size={18} className="text-red-500" />}
                </div>
                <p className="text-sm text-gray-600 mt-1">Prezzo: <span className="font-medium">{item.price} ETH</span></p>
                <p className="text-sm text-gray-600">Stato: <span className="font-semibold text-gray-800">{StateMap[item.state]}</span></p>
                {item.state === 3 && hasOffer && <p className="text-sm text-red-600 mt-1">Rimborso offerto: <span className="font-bold">{item.partialRefundOffer} ETH</span></p>}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {type === "sales" && item.state === 0 && (
                  <button onClick={() => cancelListing(item.id)} disabled={processingId === item.id} className="w-full py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center cursor-pointer">
                    {processingId === item.id ? <><Loader2 size={16} className="animate-spin mr-2" /> Annullamento...</> : "Annulla"}
                  </button>
                )}
                {type === 'sales' && item.state === 3 && !hasOffer && (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Importo in ETH" value={refundAmounts[item.id] || ''} onChange={(e) => setRefundAmounts(prev => ({ ...prev, [item.id]: e.target.value }))} className="flex-1 p-1.5 border border-red-300 bg-white rounded-md text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500" disabled={processingId === item.id}/>
                    <button onClick={() => offerPartialRefund(item.id, refundAmounts[item.id])} disabled={processingId === item.id} className="flex-1 py-1.5 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center cursor-pointer">
                      {processingId === item.id ? <><Loader2 size={16} className="animate-spin mr-2" /> Offerta...</> : "Offri rimborso"}
                    </button>
                  </div>
                )}

                {type === "purchases" && item.state === 1 && (
                  <div className="flex gap-2 w-full">
                    <button onClick={() => releaseFunds(item.id)} disabled={processingId === item.id} className="flex-1 py-1.5 bg-teal-700 text-white text-sm rounded-md hover:bg-teal-800 disabled:opacity-50 flex items-center justify-center cursor-pointer">
                      {processingId === item.id ? <><Loader2 size={16} className="animate-spin mr-2" /> Conferma...</> : "Conferma ricezione"}
                    </button>
                    <button onClick={() => openDispute(item.id)} disabled={processingId === item.id} className="flex-1 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center cursor-pointer">
                      {processingId === item.id ? <><Loader2 size={16} className="animate-spin mr-2" /> Apertura...</> : "Apri disputa"}
                    </button>
                  </div>
                )}
                {type === 'purchases' && item.state === 3 && hasOffer && (
                  <button onClick={() => acceptPartialRefund(item.id)} disabled={processingId === item.id} className="w-full py-1.5 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center cursor-pointer">
                    {processingId === item.id ? <><Loader2 size={16} className="animate-spin mr-2" /> Accettazione...</> : "Accetta rimborso"}
                  </button>
                )}
                
                {type === 'purchases' && item.state === 3 && isDisputeResolutionPeriodOver && (
                  <button onClick={() => resolveDispute(item.id)} disabled={processingId === item.id} className="w-full py-1.5 bg-sky-600 text-white text-sm rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center cursor-pointer">
                    {processingId === item.id ? <><Loader2 size={16} className="animate-spin mr-2" /> Finalizzazione...</> : "Rimborso completo"}
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  );

  return (
    <>
      <MyTransactionsButton onClick={openModal} />
      {isOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Le mie operazioni</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition p-1 cursor-pointer" disabled={loading} aria-label="Chiudi">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="flex justify-center mt-4 space-x-3">
                <button onClick={() => setActiveTab("sales")} className={`px-5 py-2 rounded-full text-sm font-medium transition cursor-pointer ${activeTab === "sales" ? "bg-teal-500 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Vendite
                </button>
                <button onClick={() => setActiveTab("purchases")} className={`px-5 py-2 rounded-full text-sm font-medium transition cursor-pointer ${activeTab === "purchases" ? "bg-teal-700 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Acquisti
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
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