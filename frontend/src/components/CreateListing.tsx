import { useState } from "react";
import { createListing } from "../contracts/marketplace";

export default function CreateListing() {
  const [metadataURI, setMetadataURI] = useState("ipfs://");
  const [price, setPrice] = useState("0.1");
  const [timeoutDays, setTimeoutDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validazione
    if (!metadataURI || metadataURI === "ipfs://") {
      setError("Inserisci un IPFS URI valido");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Il prezzo deve essere maggiore di 0");
      return;
    }

    if (timeoutDays < 1 || timeoutDays > 90) {
      setError("Il timeout deve essere tra 1 e 90 giorni");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await createListing(metadataURI, price, timeoutDays);

      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setMetadataURI("ipfs://");
        setPrice("0.1");
        setTimeoutDays(7);
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error("❌ Errore nella creazione:", err);
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">📦 Crea Nuovo Listing</h2>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✅ Listing creato con successo!</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Metadata URI */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Metadata URI (IPFS)
            </label>
            <input
              type="text"
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              placeholder="ipfs://QmXxx..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 L'URI deve puntare a un JSON con title, description, images, ecc.
            </p>
          </div>

          {/* Prezzo */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Prezzo (ETH)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Timeout (giorni)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={timeoutDays}
              onChange={(e) => setTimeoutDays(parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              ⏱️ Tempo massimo per il buyer di confermare la consegna
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">📋 Anteprima:</p>
            <div className="text-sm space-y-1 text-gray-700">
              <p>• Metadata: <span className="font-mono text-xs">{metadataURI}</span></p>
              <p>• Prezzo: <span className="font-bold">{price} ETH</span></p>
              <p>• Timeout: <span className="font-bold">{timeoutDays} giorni</span></p>
              <p>• Fee platform: <span className="font-bold text-red-600">2.5%</span> ({(parseFloat(price || "0") * 0.025).toFixed(4)} ETH)</p>
              <p>• Riceverai: <span className="font-bold text-green-600">{(parseFloat(price || "0") * 0.975).toFixed(4)} ETH</span></p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "⏳ Creazione in corso..." : "🚀 Crea Listing"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Come funziona:</strong>
          </p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>Il listing viene pubblicato on-chain</li>
            <li>I buyer possono acquistare inviando ETH</li>
            <li>I fondi vanno in escrow nel contratto</li>
            <li>Dopo la conferma di consegna, ricevi il pagamento (meno 2.5% fee)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}