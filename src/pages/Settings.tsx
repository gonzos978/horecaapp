import { Globe, Bell, Palette, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();

  const languages = [
    { code: 'sr', name: t('settings.serbian'), flag: '🇷🇸' },
    { code: 'hr', name: t('settings.croatian'), flag: '🇭🇷' },
    { code: 'bs', name: t('settings.bosnian'), flag: '🇧🇦' },
    { code: 'en', name: t('settings.english'), flag: '🇬🇧' },
    { code: 'de', name: t('settings.german'), flag: '🇩🇪' }
  ];

  return (
    <div className="space-y-6">
      <Header title={t('settings.title')} subtitle="Prilagodite sistem prema vašim potrebama" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('settings.language')}</h2>
              <p className="text-sm text-slate-600">{t('settings.selectLanguage')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  language === lang.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`font-medium ${language === lang.code ? 'text-blue-900' : 'text-slate-700'}`}>
                    {lang.name}
                  </span>
                </div>
                {language === lang.code && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-500 p-3 rounded-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('settings.notifications')}</h2>
                <p className="text-sm text-slate-600">Upravljanje obaveštenjima</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Krađa inventara', enabled: true },
                { label: 'Kasni radnici', enabled: true },
                { label: 'Niski inventar', enabled: true },
                { label: 'HACCP upozorenja', enabled: true },
                { label: 'Novi voice orderi', enabled: false }
              ].map((notif, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-700">{notif.label}</span>
                  <button
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notif.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notif.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-500 p-3 rounded-lg">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('settings.theme')}</h2>
                <p className="text-sm text-slate-600">Izgled interfejsa</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
                <div className="w-full h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded mb-2"></div>
                <span className="text-sm font-medium text-blue-900">Svetla</span>
              </button>
              <button className="p-4 border-2 border-slate-200 hover:border-slate-300 rounded-lg">
                <div className="w-full h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded mb-2"></div>
                <span className="text-sm font-medium text-slate-700">Tamna</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-lg">
          <Save className="w-5 h-5" />
          {t('settings.save')}
        </button>
      </div>
    </div>
  );
}
