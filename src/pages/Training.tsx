import { useState, useEffect } from 'react';
import { GraduationCap, Play, FileText, Award, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

export default function Training() {
  const { t, language } = useLanguage();
  const [positions, setPositions] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: positionsData } = await supabase
      .from('positions')
      .select('*')
      .order('name_sr');

    const { data: modulesData } = await supabase
      .from('training_modules')
      .select('*');

    if (positionsData) setPositions(positionsData);
    if (modulesData) setModules(modulesData);
  };

  const getPositionModules = (positionCode: string) => {
    return modules.filter(m => m.position_code === positionCode);
  };

  const contentTypeIcons = {
    VIDEO: Play,
    QUIZ: FileText,
    PRACTICE: Award,
    DOCUMENT: FileText,
    INTERACTIVE: Award
  };

  const contentTypeColors = {
    VIDEO: 'bg-red-100 text-red-800',
    QUIZ: 'bg-blue-100 text-blue-800',
    PRACTICE: 'bg-purple-100 text-purple-800',
    DOCUMENT: 'bg-slate-100 text-slate-800',
    INTERACTIVE: 'bg-emerald-100 text-emerald-800'
  };

  return (
    <div className="space-y-6">
      <Header title={t('training.title')} subtitle={`${positions.length} pozicija, ${modules.length} modula`} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">{t('training.positions')}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{positions.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">{t('training.modules')}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{modules.length}</p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Ukupno sati</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {Math.floor(modules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0) / 60)}h
              </p>
            </div>
            <div className="bg-amber-500 p-3 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Završeno</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">87%</p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider px-2">
            Pozicije
          </h3>
          <div className="space-y-1">
            {positions.slice(0, 20).map((position) => {
              const isSelected = selectedPosition === position.code;
              const posModules = getPositionModules(position.code);
              const nameKey = `name_${language}` as keyof typeof position;

              return (
                <button
                  key={position.id}
                  onClick={() => setSelectedPosition(position.code)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <div className="font-medium">{position[nameKey]}</div>
                  <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {posModules.length} modula
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedPosition ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Moduli za: {positions.find(p => p.code === selectedPosition)?.[`name_${language}`]}
              </h2>

              {getPositionModules(selectedPosition).map((module) => {
                const Icon = contentTypeIcons[module.content_type as keyof typeof contentTypeIcons];
                const titleKey = `title_${language}` as keyof typeof module;

                return (
                  <div
                    key={module.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${contentTypeColors[module.content_type as keyof typeof contentTypeColors]}`}>
                          <Icon className="w-6 h-6" />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900">{module[titleKey]}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {module.duration_minutes} min
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${contentTypeColors[module.content_type as keyof typeof contentTypeColors]}`}>
                              {module.content_type}
                            </span>
                            {module.mandatory && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                Obavezno
                              </span>
                            )}
                          </div>

                          {module.quiz_questions && JSON.parse(module.quiz_questions).length > 0 && (
                            <div className="mt-3 text-sm text-slate-600">
                              📝 {JSON.parse(module.quiz_questions).length} pitanja • Prolaznost: {module.passing_score}%
                            </div>
                          )}
                        </div>
                      </div>

                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Započni
                      </button>
                    </div>
                  </div>
                );
              })}

              {getPositionModules(selectedPosition).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  Nema dostupnih modula za ovu poziciju
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600">
                Izaberite poziciju da vidite dostupne module za obuku
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
