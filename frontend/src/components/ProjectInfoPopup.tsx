import { useState, useEffect, useRef } from 'react';
import { HelpCircle } from 'lucide-react'; 

export default function ProjectInfoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null); 

  const projectTitle = "Informazioni su Blocky";
  const projectDescription = "Blocky è una piattaforma decentralizzata che sfrutta la tecnologia blockchain (Polygon/HardHat) per la gestione sicura e trasparente delle transazione avvenute durante la vendita di articoli usati.";

  const togglePopup = () => {
    setIsOpen(prev => !prev);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex ml-2">
      
      <button
        onClick={togglePopup}
        aria-expanded={isOpen}
        aria-controls="project-info-popup"
        className="p-1 rounded-full text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 hover:ring-2 hover:ring-gray-300 focus:ring-gray-600 transition-colors cursor-pointer"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          id="project-info-popup"
          role="dialog"
          className="absolute right-0 top-10 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 p-4 z-20"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {projectTitle} 
          </h3>
          <p className="text-sm text-gray-600">
            {projectDescription}
          </p>
        </div>
      )}
    </div>
  );
}