import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

export default function AnonymousReports() {
  const { t, language } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);
  const [dummyReports] = useState([
    {
      id: 'dummy-1',
      report_type: 'harassment',
      severity_ai: 'CRITICAL',
      credibility_score: 92,
      sender_profile: 'reliable',
      status: 'investigating',
      description: 'Konobar Marko P. (ID: W034) stalno pravi neprikladne komentare o mom izgledu i fizičkom izgledu. Kada sam ga upozorila da prestanem, rekao je da preosjetljivo reagujem. Ovo se dešava svaki dan tokom smjene i osjećam se veoma neugodno. Više puta me je pitao da li želim da izađem sa njim nakon posla, iako sam jasno rekla ne. Molim da se ovo uradi odmah jer više ne mogu ovako.',
      recommended_action: 'Hitno provesti internu istragu. Razgovor sa optuženim radnikom i razgovor sa svjedocima. Razmotriti suspenziju do okončanja istrage. Dokumentovati sve dokaze.',
      created_at: '2025-12-08T14:20:00',
      evidence_data: { report_id: 'AR-2025-089' }
    },
    {
      id: 'dummy-2',
      report_type: 'guest_complaint',
      severity_ai: 'HIGH',
      credibility_score: 88,
      sender_profile: 'reliable',
      status: 'pending',
      description: 'Gost iz sobe 305 je uputio žestoku usmenu kritiku sobarici Ani K. (ID: W012) zbog nečistoće sobe. Rekao je da su peškiri bili prljavi, da je kupatilo bilo loše očišćeno i da je pronašao kosu na jastuku. Rekao je da je ovo "neprihvatljivo za hotel ovog kalibra" i zahtijevao je da se soba ponovo očisti. Ana je bila vidno uznemirena nakon ovog incidenta. Gost je takođe spomenuo da će napisati negativnu recenziju na TripAdvisoru.',
      recommended_action: 'Provjeriti sličnost sa postojećim izvještajima sobarice. Izvršiti inspekciju sobe 305. Organizovati dodatnu obuku za očišćavanje. Razmotriti kontakt sa gostom za ispriku i nadoknadu.',
      created_at: '2025-12-08T11:45:00',
      evidence_data: { report_id: 'AR-2025-090', room_number: '305' }
    }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase
      .from('anonymous_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setReports([...dummyReports, ...data]);
    } else {
      setReports(dummyReports);
    }
  };

  const credibilityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100';
    if (score >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const profileBadge = (profile: string) => {
    const config: { [key: string]: { color: string; label: string } } = {
      reliable: { color: 'bg-emerald-100 text-emerald-800', label: t('anonymousReports.reliable') },
      unreliable: { color: 'bg-red-100 text-red-800', label: t('anonymousReports.unreliable') },
      average: { color: 'bg-amber-100 text-amber-800', label: t('anonymousReports.average') },
      new: { color: 'bg-blue-100 text-blue-800', label: 'Nov' },
      unknown: { color: 'bg-slate-100 text-slate-800', label: 'Nepoznat' }
    };
    return config[profile] || config.unknown;
  };

  const severityConfig = {
    LOW: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
    MEDIUM: { color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
    HIGH: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    CRITICAL: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  };

  const statusConfig = {
    pending: { color: 'bg-amber-100 text-amber-800', label: 'Na čekanju' },
    investigating: { color: 'bg-blue-100 text-blue-800', label: t('anonymousReports.investigating') },
    resolved: { color: 'bg-emerald-100 text-emerald-800', label: t('anonymousReports.resolved') },
    dismissed: { color: 'bg-slate-100 text-slate-800', label: t('anonymousReports.dismissed') }
  };

  return (
    <div className="space-y-6">
      <Header title={t('anonymousReports.title')} subtitle={`${reports.length} prijava`} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {['pending', 'investigating', 'resolved', 'dismissed'].map((status) => {
          const count = reports.filter(r => r.status === status).length;
          const config = statusConfig[status as keyof typeof statusConfig];

          return (
            <div key={status} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">{config.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
                </div>
                <div className={`${config.color} p-3 rounded-lg`}>
                  <Shield className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('anonymousReports.credibility')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('anonymousReports.reportType')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('anonymousReports.senderProfile')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Vrijeme
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.map((report) => {
                const evidence = report.evidence_data || {};
                const reportId = evidence.report_id || report.id.substring(0, 8);
                const severity = severityConfig[report.severity_ai as keyof typeof severityConfig];
                const SeverityIcon = severity.icon;
                const profile = profileBadge(report.sender_profile);
                const status = statusConfig[report.status as keyof typeof statusConfig];

                return (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-slate-900">{reportId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${credibilityColor(report.credibility_score)}`}>
                          {report.credibility_score}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {t(`anonymousReports.${report.report_type}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${severity.color}`}>
                        <SeverityIcon className="w-3 h-3" />
                        {report.severity_ai}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${profile.color}`}>
                        {profile.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(report.created_at).toLocaleString('sr-RS')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {reports.length > 0 && reports[0] && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Eye className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">Najnovija prijava (detalji)</h3>
              <p className="text-slate-700 mb-3">{reports[0].description}</p>
              {reports[0].recommended_action && (
                <div className="bg-white border border-blue-300 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">Preporučena akcija:</p>
                  <p className="text-sm text-slate-700 mt-1">{reports[0].recommended_action}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
