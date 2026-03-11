import React, { useState } from 'react';
import { Search, Filter, Share2, Download, X, UploadCloud, ChevronLeft, ChevronRight, Info, CheckCircle2 } from 'lucide-react';
import { Vehicle } from '../types';
import { useVehicles } from '../VehicleContext';

export default function Catalog() {
  const { vehicles, saveVehiclesToFirebase } = useVehicles();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  
  // Details Modal State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImport = async () => {
    if (!importUrl) return;
    
    setIsImporting(true);
    setImportError('');
    
    try {
      const response = await fetch('/api/catalog/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao importar catálogo');
      }

      // Tenta encontrar a lista de veículos no JSON/XML parseado
      let importedList: any[] = [];
      const data = result.data;
      
      if (Array.isArray(data)) {
        importedList = data;
      } else if (data.estoque && data.estoque.veiculo) {
        importedList = Array.isArray(data.estoque.veiculo) ? data.estoque.veiculo : [data.estoque.veiculo];
      } else if (data.veiculos && data.veiculos.veiculo) {
        importedList = Array.isArray(data.veiculos.veiculo) ? data.veiculos.veiculo : [data.veiculos.veiculo];
      } else if (data.ADS && data.ADS.AD) {
        importedList = Array.isArray(data.ADS.AD) ? data.ADS.AD : [data.ADS.AD];
      } else {
        // Busca qualquer array no objeto
        for (const key in data) {
          if (Array.isArray(data[key])) {
            importedList = data[key];
            break;
          } else if (typeof data[key] === 'object' && data[key] !== null) {
            for (const subKey in data[key]) {
              if (Array.isArray(data[key][subKey])) {
                importedList = data[key][subKey];
                break;
              }
            }
          }
        }
      }

      if (importedList.length === 0) {
        throw new Error('Nenhum veículo encontrado no arquivo importado. Verifique o formato.');
      }

      // Mapeia os dados importados para o formato do sistema
      const mappedVehicles: Vehicle[] = importedList.map((v: any, index: number) => {
        // Tenta extrair os campos de várias formas comuns em XMLs de veículos
        const brand = v.marca || v.Marca || v.brand || v.make || v.MAKE || 'Marca Desconhecida';
        const model = v.modelo || v.Modelo || v.model || v.MODEL || 'Modelo Desconhecido';
        const yearStr = v.ano_fabricacao || v.ano_modelo || v.ano || v.Ano || v.year || v.YEAR || '2020';
        const priceStr = v.preco || v.valor || v.Preco || v.Valor || v.price || v.PRICE || '0';
        const mileageStr = v.km || v.quilometragem || v.Km || v.mileage || v.MILEAGE || '0';
        
        let images: string[] = [];
        if (v.fotos && v.fotos.foto) {
          images = Array.isArray(v.fotos.foto) ? v.fotos.foto : [v.fotos.foto];
        } else if (v.fotos && Array.isArray(v.fotos)) {
          images = v.fotos;
        } else if (v.imagem || v.image || v.foto) {
          images = [v.imagem || v.image || v.foto];
        } else if (v.IMAGES && v.IMAGES.IMAGE_URL) {
          images = Array.isArray(v.IMAGES.IMAGE_URL) ? v.IMAGES.IMAGE_URL : [v.IMAGES.IMAGE_URL];
        } else if (v.IMAGES_LARGE && v.IMAGES_LARGE.IMAGE_URL_LARGE) {
          images = Array.isArray(v.IMAGES_LARGE.IMAGE_URL_LARGE) ? v.IMAGES_LARGE.IMAGE_URL_LARGE : [v.IMAGES_LARGE.IMAGE_URL_LARGE];
        }
        
        const image = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800';

        let features: string[] = [];
        if (v.opcionais && v.opcionais.opcional) {
          features = Array.isArray(v.opcionais.opcional) ? v.opcionais.opcional : [v.opcionais.opcional];
        } else if (v.opcionais && typeof v.opcionais === 'string') {
          features = v.opcionais.split(',').map((f: string) => f.trim());
        } else if (v.features && Array.isArray(v.features)) {
          features = v.features;
        } else if (v.ACCESSORIES && typeof v.ACCESSORIES === 'string') {
          features = v.ACCESSORIES.split(',').map((f: string) => f.trim()).filter(Boolean);
        }

        return {
          id: String(v.id || v.codigo || v.placa || v.ID || `imported-${Date.now()}-${index}`).substring(0, 99),
          brand: String(brand || 'Marca Desconhecida').substring(0, 49),
          model: String(model || 'Modelo Desconhecido').substring(0, 99),
          year: parseInt(String(yearStr).replace(/\D/g, '').substring(0, 4)) || 2020,
          price: parseFloat(String(priceStr).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          mileage: parseInt(String(mileageStr).replace(/\D/g, '')) || 0,
          image: (typeof image === 'string' ? image : (image as any)?.url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800').substring(0, 999),
          images: images.map(img => typeof img === 'string' ? img : (img as any)?.url).filter(Boolean).slice(0, 19).map(i => String(i).substring(0, 999)),
          features: features.map(f => String(f).substring(0, 99)).slice(0, 49),
          description: String(v.DESCRIPTION || v.descricao || v.observacao || '').substring(0, 1999),
          fuel: String(v.FUEL || v.combustivel || '').substring(0, 49),
          transmission: String(v.GEAR || v.cambio || '').substring(0, 49),
          color: String(v.COLOR || v.cor || '').substring(0, 49),
          doors: Math.max(1, parseInt(String(v.DOORS || v.portas || '0').replace(/\D/g, '')) || 0),
          plate: String(v.PLATE || v.placa || '').substring(0, 19)
        };
      });

      await saveVehiclesToFirebase(mappedVehicles);
      setIsImportModalOpen(false);
      setImportUrl('');
      alert(`${mappedVehicles.length} veículos importados com sucesso!`);
      
    } catch (error) {
      console.error("Import error:", error);
      setImportError(error instanceof Error ? error.message : 'Erro ao importar catálogo');
    } finally {
      setIsImporting(false);
    }
  };

  const openDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedVehicle?.images && selectedVehicle.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedVehicle.images!.length);
    }
  };

  const prevImage = () => {
    if (selectedVehicle?.images && selectedVehicle.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedVehicle.images!.length) % selectedVehicle.images!.length);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Catálogo de Veículos</h2>
            <p className="text-sm text-slate-500 mt-1">Sincronizado via XML/JSON com o sistema principal (ERP).</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar modelo ou marca..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm transition-all outline-none shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Importar XML/JSON
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">
              <Filter className="w-4 h-4" /> Filtros
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-slate-800">
                  {vehicle.year}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{vehicle.brand}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{vehicle.model}</h3>
                <div className="text-2xl font-bold text-emerald-600 mb-4">
                  R$ {vehicle.price.toLocaleString('pt-BR')}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">{vehicle.mileage === 0 ? '0 km' : `${vehicle.mileage.toLocaleString('pt-BR')} km`}</span>
                  {vehicle.features.slice(0, 2).map(f => (
                    <span key={f} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">{f}</span>
                  ))}
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => openDetails(vehicle)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                  <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="Compartilhar Link">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                <p className="text-sm text-slate-500">{selectedVehicle.year} • {selectedVehicle.mileage === 0 ? '0 km' : `${selectedVehicle.mileage.toLocaleString('pt-BR')} km`}</p>
              </div>
              <button 
                onClick={() => setSelectedVehicle(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: Images */}
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] bg-slate-200 rounded-xl overflow-hidden group">
                    <img 
                      src={selectedVehicle.images && selectedVehicle.images.length > 0 ? selectedVehicle.images[currentImageIndex] : selectedVehicle.image} 
                      alt={selectedVehicle.model} 
                      className="w-full h-full object-cover"
                    />
                    
                    {selectedVehicle.images && selectedVehicle.images.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                          {currentImageIndex + 1} / {selectedVehicle.images.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnails */}
                  {selectedVehicle.images && selectedVehicle.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                      {selectedVehicle.images.map((img, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`relative shrink-0 w-20 h-15 rounded-lg overflow-hidden snap-start transition-all ${currentImageIndex === idx ? 'ring-2 ring-blue-600 ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Details */}
                <div className="space-y-6">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600 mb-2">
                      R$ {selectedVehicle.price.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Info className="w-4 h-4" /> Preço sujeito a alteração
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Ano</div>
                      <div className="font-medium text-slate-800">{selectedVehicle.year}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Quilometragem</div>
                      <div className="font-medium text-slate-800">{selectedVehicle.mileage === 0 ? '0 km' : `${selectedVehicle.mileage.toLocaleString('pt-BR')} km`}</div>
                    </div>
                    {selectedVehicle.transmission && (
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Câmbio</div>
                        <div className="font-medium text-slate-800 capitalize">{selectedVehicle.transmission}</div>
                      </div>
                    )}
                    {selectedVehicle.fuel && (
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Combustível</div>
                        <div className="font-medium text-slate-800 capitalize">{selectedVehicle.fuel}</div>
                      </div>
                    )}
                    {selectedVehicle.color && (
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Cor</div>
                        <div className="font-medium text-slate-800 capitalize">{selectedVehicle.color}</div>
                      </div>
                    )}
                    {selectedVehicle.plate && (
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Placa</div>
                        <div className="font-medium text-slate-800 uppercase">{selectedVehicle.plate}</div>
                      </div>
                    )}
                  </div>

                  {selectedVehicle.description && (
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">Descrição</h4>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {selectedVehicle.description}
                      </div>
                    </div>
                  )}

                  {selectedVehicle.features && selectedVehicle.features.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">Opcionais</h4>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedVehicle.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="capitalize">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">
                <Share2 className="w-4 h-4" /> Compartilhar Veículo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" /> Importar Catálogo
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL do XML ou JSON</label>
                <input 
                  type="url" 
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://exemplo.com/feed.xml"
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Cole a URL do feed do seu sistema (ex: Revenda Mais, Webmotors, etc).
                </p>
              </div>

              {importError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {importError}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleImport}
                  disabled={isImporting || !importUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Importar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
