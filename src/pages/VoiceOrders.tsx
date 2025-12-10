import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, ShieldAlert, TrendingDown, TrendingUp, UserX } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

export default function VoiceOrders() {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [mockTranscript, setMockTranscript] = useState('');

  const [aiSecurityAlerts] = useState([
    {
      id: 1,
      type: 'keyword_detection',
      worker: 'Petar Jovanović (Kuvar K003)',
      severity: 'critical',
      keywords: ['otkaz', 'napuštam', 'neću više'],
      transcript: 'Pun mi je više ovaj posao, daću otkaz sledeće nedelje...',
      timestamp: '14:35',
      date: 'Danas',
      action: 'Vlasnik obavešten - Sastanak zakazan'
    },
    {
      id: 2,
      type: 'theft_detection',
      worker: 'Marko Petrović (Konobar W034)',
      severity: 'high',
      discrepancy: {
        typed_items: 8,
        recorded_items: 11,
        missing: ['Espresso x2', 'Coca Cola x1'],
        estimated_loss: 6.50
      },
      timestamp: '19:45',
      date: 'Danas',
      pattern: '2 od 3 smjene - Sumnja na sistematsku krađu'
    },
    {
      id: 3,
      type: 'theft_detection',
      worker: 'Stefan Marić (Konobar W028)',
      severity: 'high',
      discrepancy: {
        typed_items: 12,
        recorded_items: 15,
        missing: ['Pivo x2', 'Vino belo x1'],
        estimated_loss: 9.00
      },
      timestamp: '21:15',
      date: 'Danas',
      pattern: '2 od 3 smjene - Sumnja na sistematsku krađu'
    },
    {
      id: 4,
      type: 'flirting_detection',
      workers: ['Milica Tomić (Šankerica)', 'Nikola Đorđević (Šef konobara)'],
      severity: 'medium',
      observations: [
        'Učestali razgovori van radnog konteksta',
        'Milica izbacuje kafe bez kucanja u prisustvu Nikole',
        'Nikola ne kuca artikle i uzima gotovinu'
      ],
      estimated_loss: 45.00,
      frequency: '5-7 puta dnevno',
      timestamp: 'Cio dan',
      date: 'Praćeno 3 dana'
    }
  ]);

  const [financialSummary] = useState({
    total_loss_detected: 315.50,
    potential_annual_loss: 9465.00,
    estimated_savings: 8850.00,
    theft_incidents: 12,
    prevented_incidents: 8
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase
      .from('voice_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setOrders(data);
  };

  const handleRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setIsProcessing(true);

      const mockTranscripts = [
        'Sto šest, tri kafe, dva čevapa, salata',
        'Sto dvanaest, pizza margherita, vino belo',
        'Sto četiri, dva šnicla, pomfrit, pivo',
        'Sto osam, tiramisu, espresso'
      ];

      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setMockTranscript(transcript);

      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <Header title={t('voice.title')} subtitle={`${orders.length} porudžbina snimljeno`} />

      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-6">
            {isRecording ? (
              <div className="relative">
                <Mic className="w-12 h-12 text-white animate-pulse" />
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
              </div>
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {isRecording ? t('voice.recording') : isProcessing ? t('voice.processing') : t('voice.title')}
          </h2>

          {!isRecording && !isProcessing && (
            <p className="text-blue-100 mb-6">Pritisnite dugme da snimite glasovnu porudžbinu</p>
          )}

          {isRecording && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-8 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-12 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-16 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-12 bg-white rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
                <div className="w-2 h-8 bg-white rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          )}

          {mockTranscript && !isProcessing && (
            <div className="bg-white/20 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium mb-1">{t('voice.transcript')}:</p>
              <p className="text-lg font-bold">{mockTranscript}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-sm">{t('voice.confidence')}:</span>
                <span className="text-lg font-bold">92%</span>
              </div>
            </div>
          )}

          <button
            onClick={handleRecord}
            disabled={isRecording || isProcessing}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
              isRecording || isProcessing
                ? 'bg-white/20 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:shadow-lg'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5 inline mr-2" />
                {t('voice.recording')}
              </>
            ) : isProcessing ? (
              <>
                <Volume2 className="w-5 h-5 inline mr-2 animate-pulse" />
                {t('voice.processing')}
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 inline mr-2" />
                {t('voice.record')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-bold text-slate-900">AI Sigurnosna Upozorenja</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <span className="text-3xl font-bold text-red-900">€{financialSummary.total_loss_detected.toFixed(2)}</span>
            </div>
            <p className="text-sm font-medium text-red-700">Otkrivena šteta (mjesec)</p>
            <p className="text-xs text-red-600 mt-1">{financialSummary.theft_incidents} incidenata</p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-amber-600" />
              <span className="text-3xl font-bold text-amber-900">€{financialSummary.potential_annual_loss.toFixed(0)}</span>
            </div>
            <p className="text-sm font-medium text-amber-700">Potencijalni gubitak (godišnje)</p>
            <p className="text-xs text-amber-600 mt-1">Bez AI zaštite</p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              <span className="text-3xl font-bold text-emerald-900">€{financialSummary.estimated_savings.toFixed(0)}</span>
            </div>
            <p className="text-sm font-medium text-emerald-700">Procenjena ušteda (godišnje)</p>
            <p className="text-xs text-emerald-600 mt-1">{financialSummary.prevented_incidents} spriječenih krađa</p>
          </div>
        </div>

        <div className="space-y-4">
          {aiSecurityAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-2 rounded-xl p-5 ${
                alert.severity === 'critical'
                  ? 'bg-red-50 border-red-300'
                  : alert.severity === 'high'
                  ? 'bg-orange-50 border-orange-300'
                  : 'bg-amber-50 border-amber-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {alert.type === 'keyword_detection' && <UserX className="w-6 h-6 text-red-600 flex-shrink-0" />}
                {alert.type === 'theft_detection' && <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />}
                {alert.type === 'flirting_detection' && <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />}

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {alert.type === 'keyword_detection' && '🚨 Detekcija rizičnih ključnih riječi'}
                        {alert.type === 'theft_detection' && '⚠️ Odstupanje: Kucani vs Snimljeni artikli'}
                        {alert.type === 'flirting_detection' && '👥 Sumnjivo ponašanje: Flertovanje'}
                      </h4>
                      <p className="text-sm text-slate-700 mt-1">
                        {alert.type === 'flirting_detection'
                          ? alert.workers.join(' & ')
                          : alert.worker
                        }
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      alert.severity === 'critical'
                        ? 'bg-red-600 text-white'
                        : alert.severity === 'high'
                        ? 'bg-orange-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>

                  {alert.type === 'keyword_detection' && (
                    <div className="space-y-2">
                      <div className="bg-white border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-900 mb-1">Transkripcija:</p>
                        <p className="text-sm text-slate-700 italic">"{alert.transcript}"</p>
                      </div>
                      <div className="bg-white border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-900 mb-1">Ključne riječi:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {alert.keywords.map((kw, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3">
                        <p className="text-sm font-bold text-emerald-900">✓ {alert.action}</p>
                      </div>
                    </div>
                  )}

                  {alert.type === 'theft_detection' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-orange-200 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">Kucano na kasi</p>
                          <p className="text-2xl font-bold text-slate-900">{alert.discrepancy.typed_items}</p>
                        </div>
                        <div className="bg-white border border-orange-200 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">AI Snimio</p>
                          <p className="text-2xl font-bold text-orange-600">{alert.discrepancy.recorded_items}</p>
                        </div>
                      </div>
                      <div className="bg-white border border-orange-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-900 mb-1">Nedostajući artikli:</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.discrepancy.missing.map((item, idx) => (
                            <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-bold">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                        <p className="text-sm font-bold text-red-900">
                          💰 Procenjena šteta: €{alert.discrepancy.estimated_loss.toFixed(2)}
                        </p>
                        <p className="text-xs text-red-700 mt-1">{alert.pattern}</p>
                      </div>
                    </div>
                  )}

                  {alert.type === 'flirting_detection' && (
                    <div className="space-y-2">
                      <div className="bg-white border border-amber-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-900 mb-2">Zapažanja:</p>
                        <ul className="space-y-1">
                          {alert.observations.map((obs, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-amber-600">•</span>
                              <span>{obs}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-amber-200 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">Frekvencija</p>
                          <p className="text-lg font-bold text-amber-900">{alert.frequency}</p>
                        </div>
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                          <p className="text-xs text-red-700 mb-1">Procenjena šteta</p>
                          <p className="text-lg font-bold text-red-900">€{alert.estimated_loss.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                    <span>{alert.date}</span>
                    <span>•</span>
                    <span>{alert.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Poslednjih 10 porudžbina</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {orders.map((order) => (
            <div key={order.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold">
                      {t('voice.table')} {order.table_number}
                    </span>
                    <span className={`px-3 py-1 rounded-lg font-medium ${
                      Number(order.confidence_score) >= 0.9 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {(Number(order.confidence_score) * 100).toFixed(0)}% {t('voice.confidence').toLowerCase()}
                    </span>
                    {order.urgency && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-lg font-medium flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {t('voice.urgent')}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 font-medium mb-3">{order.transcript}</p>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(order.parsed_items).map((item: any, idx: number) => (
                      <div key={idx} className="px-3 py-1 bg-slate-100 rounded-lg text-sm">
                        <span className="font-medium">{item.qty}x</span> {item.name}
                        <span className="text-slate-600 ml-2">€{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
