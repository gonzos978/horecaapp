import { useState, useEffect } from 'react';
import { Users, Star, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../fb/firebase';
import { useAuth } from '../contexts/AuthContext';

import Header from '../components/Header';

export default function Workers() {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [workers, setWorkers] = useState<any[]>([]);
    // @ts-ignore
    const [positions, setPositions] = useState<any[]>([]);

    useEffect(() => {
        loadWorkers();
    }, []);

    const loadWorkers = async () => {
        if (!currentUser?.customerId) return;

        let rolesToFetch: string[] = [];

        if (currentUser.role === 'manager') {
            rolesToFetch = ['worker'];
        } else if (currentUser.role === 'customer') {
            rolesToFetch = ['manager', 'worker'];
        } else {
            rolesToFetch = ['worker'];
        }

        try {
            const q = query(
                collection(db, 'users'),
                where('customerId', '==', currentUser.customerId),
                where('role', 'in', rolesToFetch)
            );

            const querySnapshot = await getDocs(q);

            const workersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setWorkers(workersData);

        } catch (err) {
            console.error('Error fetching workers:', err);
        }
    };

    const getPositionName = (code: string) => {
        const position = positions.find(p => p.code === code);
        return position ? position.name_sr : code;
    };

    return (
        <div className="space-y-6">
            <Header
                title={t('workers.title')}
                subtitle={`${workers.length} ${t('workers.title').toLowerCase()}`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Ukupno radnika',
                        value: workers.length,
                        icon: Users,
                        color: 'bg-blue-500'
                    },
                    {
                        label: 'Aktivnih',
                        value: workers.filter(w => w.active).length,
                        icon: CheckCircle,
                        color: 'bg-emerald-500'
                    },
                    {
                        label: 'Prosečan skor',
                        value: Math.round(
                            workers.reduce(
                                (sum, w) => sum + (w.performance_score || 0),
                                0
                            ) / workers.length || 0
                        ),
                        icon: Star,
                        color: 'bg-amber-500'
                    },
                    {
                        label: 'Na vreme %',
                        value:
                            Math.round(
                                workers.reduce(
                                    (sum, w) => sum + Number(w.on_time_percentage || 0),
                                    0
                                ) / workers.length || 0
                            ) + '%',
                        icon: TrendingUp,
                        color: 'bg-teal-500'
                    }
                ].map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 font-medium">
                                        {stat.label}
                                    </p>

                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        {stat.value}
                                    </p>
                                </div>

                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
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
                                {t('workers.name')}
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Email
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                {t('workers.position')}
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Role
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                {t('workers.status')}
                            </th>

                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">

                        {workers.map((worker, index) => (

                            <tr
                                key={worker.id}
                                onClick={() =>
                                    navigate(
                                        `/app/workers/${encodeURIComponent(worker.id)}`,
                                        {
                                            state: { worker },
                                        }
                                    )
                                }
                                className="hover:bg-slate-50 transition-colors cursor-pointer"
                            >

                                <td className="px-6 py-4 whitespace-nowrap">

                                    <div className="flex items-center gap-3">

                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                                index === 0
                                                    ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                                                    : index === 1
                                                        ? 'bg-gradient-to-br from-slate-300 to-slate-500'
                                                        : index === 2
                                                            ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                                            : 'bg-gradient-to-br from-blue-400 to-blue-600'
                                            }`}
                                        >
                                            {worker.firstName?.[0] || worker.email?.[0]}
                                            {worker.lastName?.[0] || ''}
                                        </div>

                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {worker.firstName} {worker.lastName}
                                            </p>

                                            <p className="text-sm text-slate-500">
                                                {worker.name}
                                            </p>
                                        </div>

                                    </div>

                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                                    {worker.email}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">

                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getPositionName(worker.type)}
                    </span>

                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">

                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {worker.role}
                    </span>

                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">

                                    {worker.active ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                                            {t('workers.active')}
                      </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        <XCircle className="w-3 h-3" />
                                            {t('workers.inactive')}
                      </span>
                                    )}

                                </td>

                            </tr>

                        ))}

                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    );
}