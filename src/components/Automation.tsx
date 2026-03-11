import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, Clock, Zap, Link2, Save, CheckCircle2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface DaySchedule {
  day: string;
  isOpen: boolean;
  start: string;
  end: string;
}

export default function Automation() {
  const [isBotEnabled, setIsBotEnabled] = useState(true);
  const [botMode, setBotMode] = useState<'always' | 'outside_hours'>('outside_hours');
  const [saved, setSaved] = useState(false);

  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: 'Segunda-feira', isOpen: true, start: '09:00', end: '18:00' },
    { day: 'Terça-feira', isOpen: true, start: '09:00', end: '18:00' },
    { day: 'Quarta-feira', isOpen: true, start: '09:00', end: '18:00' },
    { day: 'Quinta-feira', isOpen: true, start: '09:00', end: '18:00' },
    { day: 'Sexta-feira', isOpen: true, start: '09:00', end: '18:00' },
    { day: 'Sábado', isOpen: true, start: '09:00', end: '13:00' },
    { day: 'Domingo', isOpen: false, start: '09:00', end: '18:00' },
  ]);
  const [prompt, setPrompt] = useState("Você é um assistente virtual de uma concessionária de veículos de luxo. Seja educado, persuasivo e objetivo. Se o cliente perguntar sobre financiamento, informe que trabalhamos com as principais taxas do mercado e peça o CPF para simulação. Se o cliente quiser vender um carro, peça fotos e o ano/modelo para avaliação.");
  const [followUpEnabled, setFollowUpEnabled] = useState(true);
  const [followUpMessage, setFollowUpMessage] = useState("Olá {nome_cliente}, como estão os primeiros dias com o seu {veiculo}? Tudo certo? Qualquer dúvida estamos à disposição!");
  const [docEnabled, setDocEnabled] = useState(true);
  const [docMessage, setDocMessage] = useState("Olá {nome_cliente}! Passando para avisar que o documento do seu {veiculo} já está disponível para retirada em nossa loja.");
  const [birthdayEnabled, setBirthdayEnabled] = useState(true);
  const [birthdayMessage, setBirthdayMessage] = useState("Parabéns {nome_cliente}! A equipe Elite Motors deseja um feliz aniversário e muitas felicidades. Que tal comemorar de carro novo? 🎉");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'automation');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.isBotEnabled !== undefined) setIsBotEnabled(data.isBotEnabled);
          if (data.botMode) setBotMode(data.botMode);
          if (data.schedule) setSchedule(data.schedule);
          if (data.prompt) setPrompt(data.prompt);
          if (data.followUpEnabled !== undefined) setFollowUpEnabled(data.followUpEnabled);
          if (data.followUpMessage) setFollowUpMessage(data.followUpMessage);
          if (data.docEnabled !== undefined) setDocEnabled(data.docEnabled);
          if (data.docMessage) setDocMessage(data.docMessage);
          if (data.birthdayEnabled !== undefined) setBirthdayEnabled(data.birthdayEnabled);
          if (data.birthdayMessage) setBirthdayMessage(data.birthdayMessage);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/automation');
      }
    };
    fetchSettings();
  }, []);

  const handleScheduleChange = (index: number, field: keyof DaySchedule, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'automation'), {
        isBotEnabled,
        botMode,
        schedule,
        prompt,
        followUpEnabled,
        followUpMessage,
        docEnabled,
        docMessage,
        birthdayEnabled,
        birthdayMessage
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/automation');
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Automação & Chatbot (IA)</h2>
            <p className="text-sm text-slate-500 mt-1">Configure o comportamento da inteligência artificial e horários de atendimento.</p>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saved ? 'Salvo!' : 'Salvar Configurações'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isBotEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Assistente Virtual EliteCRM</h3>
              <p className="text-sm text-slate-500">Treinado para atendimento de loja de veículos.</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className={`text-sm font-medium ${isBotEnabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                {isBotEnabled ? 'Bot Ativo' : 'Bot Desativado'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isBotEnabled}
                  onChange={(e) => setIsBotEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          <div className={`p-6 space-y-8 ${!isBotEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Prompt Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prompt de Treinamento da IA (Contexto)</label>
              <textarea 
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Comportamento do Bot */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Zap className="w-4 h-4 text-amber-500" /> Comportamento de Atendimento
                </h4>
                
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${botMode === 'always' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="botMode" 
                      checked={botMode === 'always'}
                      onChange={() => setBotMode('always')}
                      className="mt-1 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Atender Sempre (24/7)</div>
                      <div className="text-xs text-slate-500 mt-1 leading-relaxed">O bot responde todas as mensagens imediatamente, transferindo para um humano apenas se o cliente solicitar.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${botMode === 'outside_hours' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="botMode" 
                      checked={botMode === 'outside_hours'}
                      onChange={() => setBotMode('outside_hours')}
                      className="mt-1 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Apenas Fora do Horário Comercial</div>
                      <div className="text-xs text-slate-500 mt-1 leading-relaxed">Durante o horário comercial, as mensagens vão direto para a equipe. O bot assume automaticamente quando a loja fecha.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Horário de Funcionamento */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-blue-500" /> Horário Comercial
                </h4>
                
                <div className={`space-y-2 ${botMode === 'always' ? 'opacity-50 pointer-events-none' : ''}`}>
                  {schedule.map((day, index) => (
                    <div key={day.day} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <label className="flex items-center gap-3 min-w-[140px] cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={day.isOpen}
                          onChange={(e) => handleScheduleChange(index, 'isOpen', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                        />
                        <span className={`text-sm font-medium ${day.isOpen ? 'text-slate-700' : 'text-slate-400'}`}>
                          {day.day}
                        </span>
                      </label>
                      
                      {day.isOpen ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={day.start}
                            onChange={(e) => handleScheduleChange(index, 'start', e.target.value)}
                            className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <span className="text-slate-400 text-sm">até</span>
                          <input 
                            type="time" 
                            value={day.end}
                            onChange={(e) => handleScheduleChange(index, 'end', e.target.value)}
                            className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic px-4">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Mensagens Prontas e Programadas</h3>
            <p className="text-sm text-slate-500 mt-1">Gerencie mensagens automáticas para follow-up, documentação e aniversários via WhatsApp.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Follow-up Pós-venda */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-500 transition-colors bg-slate-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-800">Follow-up Pós-venda</h4>
                    <p className="text-xs text-slate-500 mt-1">Enviado 7 dias após a venda</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={followUpEnabled} onChange={(e) => setFollowUpEnabled(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <textarea 
                  className="w-full h-24 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                />
              </div>

              {/* Lembrete de Documentação */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-500 transition-colors bg-slate-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-800">Documentação</h4>
                    <p className="text-xs text-slate-500 mt-1">Quando doc estiver pronto</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={docEnabled} onChange={(e) => setDocEnabled(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <textarea 
                  className="w-full h-24 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  value={docMessage}
                  onChange={(e) => setDocMessage(e.target.value)}
                />
              </div>

              {/* Mensagem de Aniversário */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-500 transition-colors bg-slate-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-800">Aniversário</h4>
                    <p className="text-xs text-slate-500 mt-1">No dia do aniversário</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={birthdayEnabled} onChange={(e) => setBirthdayEnabled(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <textarea 
                  className="w-full h-24 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  value={birthdayMessage}
                  onChange={(e) => setBirthdayMessage(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Link2 className="w-5 h-5" /> Integrações de Canais</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Evolution API</div>
                <div className="text-xs text-slate-500">Conexão WhatsApp (QR Code)</div>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">Conectado</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">API Oficial Meta</div>
                <div className="text-xs text-slate-500">Instagram & Messenger</div>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">Conectado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
