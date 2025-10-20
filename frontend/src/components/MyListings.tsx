// src/components/MyListings.tsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";

interface Props {
  contract: ethers.Contract | null;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const StateMap: { [key: number]: string } = {
    0: "Attivo",
    1: "Venduto (in attesa di conferma da parte dell'acquirente)",
    2: "Venduto (completato)",
    3: "In Disputa",
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
                // --- CARICAMENTO VENDITE (getMySales) ---
                const salesData = await contract.getMySales();
                // ❗️ Correzione qui: assicurati di destrutturare 6 elementi
                const [
                    salesIds,        // 0: ids
                    buyers,          // 1: buyers
                    salesPrices,     // 2: prices
                    salesTitles,     // 3: titles
                    salesStates,     // 4: states
                    soldAtsSales,    // 5: soldAts (opzionale, ma da includere)
                ] = salesData; 

                const parsedSales = salesIds.map((id: bigint, i: number) => ({
                    id: id.toString(),
                    buyer: buyers[i],
                    price: ethers.formatEther(salesPrices[i]) + " ETH",
                    title: salesTitles[i],
                    state: Number(salesStates[i]),
                    soldAt: Number(soldAtsSales[i])
                }));
                setSales(parsedSales);


                // --- CARICAMENTO ACQUISTI (getMyPurchases) ---
                const purchasesData = await contract.getMyPurchases();
                // ❗️ Correzione qui: assicurati di destrutturare 6 elementi
                const [
                    purchasesIds,       // 0: ids
                    sellers,            // 1: sellers
                    purchasesPrices,    // 2: prices
                    purchasesTitles,    // 3: titles
                    purchasesStates,    // 4: states
                    soldAtsPurchases,   // 5: soldAts (opzionale, ma da includere)
                ] = purchasesData;

                const parsedPurchases = purchasesIds.map((id: bigint, i: number) => ({
                    id: id.toString(),
                    seller: sellers[i],
                    price: ethers.formatEther(purchasesPrices[i]) + " ETH",
                    title: purchasesTitles[i],
                    state: Number(purchasesStates[i]),
                    soldAt: Number(soldAtsPurchases[i])
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
            // Qui dovresti idealmente ricaricare i dati o usare un callback
            window.location.reload(); // Soluzione semplice per ricaricare
        } catch (err: any) {
            console.error("Azione fallita:", err);
            showNotification(err.reason || "Azione fallita.", 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const cancelListing = (id: string) => handleAction(() => { setProcessingId(id); return contract!.cancelListing(id); });
    const releaseFunds = (id: string) => handleAction(() => { setProcessingId(id); return contract!.releaseFunds(id); });
    
    const renderList = (items: any[], type: 'sales' | 'purchases') => (
        <ul className="space-y-3 mt-4">
        {items.length === 0 ? <p className="text-gray-500">Nessun elemento.</p> :
            items.map(item => (
            <li key={item.id} className="border p-3 rounded-md text-sm">
                <p><strong>{item.title}</strong> ({item.price})</p>
                <p>Stato: <span className="font-semibold">{StateMap[item.state]}</span></p>
                {type === 'sales' && item.state === 0 && <button onClick={() => cancelListing(item.id)} disabled={processingId === item.id} className="text-red-500 hover:underline disabled:text-gray-400">Annulla</button>}
                {type === 'purchases' && item.state === 1 && <button onClick={() => releaseFunds(item.id)} disabled={processingId === item.id} className="text-green-500 hover:underline disabled:text-gray-400">Conferma Ricezione</button>}
            </li>
            ))
        }
        </ul>
  );

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">I Miei Annunci</h2>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                <button onClick={() => setActiveTab('sales')} className={`${activeTab === 'sales' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Le Mie Vendite</button>
                <button onClick={() => setActiveTab('purchases')} className={`${activeTab === 'purchases' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>I Miei Acquisti</button>
            </nav>
        </div>
        {loading ? <p className="mt-4">Caricamento...</p> : (
            activeTab === 'sales' ? renderList(sales, 'sales') : renderList(purchases, 'purchases')
        )}
        </div>
  );
}