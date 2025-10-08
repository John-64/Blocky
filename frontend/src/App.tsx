import ConnectWallet from "./components/ConnectWallet";
import CreateListing from "./components/CreateListing";
import ListingsList from "./components/ListingsList";
import { useMarketplace } from "./hooks/useMarketplace";

export default function App() {
  const { contract } = useMarketplace();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Blocky
        </h1>

        <ConnectWallet />
        <CreateListing contract={contract} onCreated={() => console.log("Nuovo annuncio creato")} />
        <ListingsList contract={contract} />
      </div>
    </div>
  );
}