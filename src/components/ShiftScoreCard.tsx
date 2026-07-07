import { Award } from 'lucide-react';

interface Props {
  score: number;
  checklistsCompleted: number;
  checklistsTotal: number;
  greenThreshold?: number;
  amberThreshold?: number;
}

export default function ShiftScoreCard({ score, checklistsCompleted, checklistsTotal, greenThreshold = 90, amberThreshold = 50 }: Props) {
  if (checklistsTotal === 0) return null;

  const color =
    score >= greenThreshold ? 'emerald' :
    score >= amberThreshold ? 'amber'   : 'red';

  const ring  = { emerald: 'ring-emerald-400', amber: 'ring-amber-400', red: 'ring-red-400' }[color];
  const bg    = { emerald: 'bg-emerald-50',    amber: 'bg-amber-50',    red: 'bg-red-50'    }[color];
  const text  = { emerald: 'text-emerald-700', amber: 'text-amber-700', red: 'text-red-700'  }[color];
  const bold  = { emerald: 'text-emerald-900', amber: 'text-amber-900', red: 'text-red-900'  }[color];
  const bar   = { emerald: 'bg-emerald-500',   amber: 'bg-amber-500',   red: 'bg-red-500'    }[color];
  const track = { emerald: 'bg-emerald-200',   amber: 'bg-amber-200',   red: 'bg-red-200'    }[color];

  const label =
    score >= greenThreshold ? 'Odlično! Sve liste završene.' :
    score >= amberThreshold ? 'U toku — nastavi tako.' :
                              'Nedovršene liste — potrudi se.';

  return (
    <div className={`${bg} rounded-xl shadow-sm p-5 ring-2 ${ring}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ${ring} bg-white`}>
          <Award className={`w-5 h-5 ${text}`} />
        </div>
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wide ${text}`}>Score smjene</p>
          <p className={`text-xs ${text} opacity-75`}>{label}</p>
        </div>
        <span className={`text-3xl font-extrabold tabular-nums ${bold}`}>{score}%</span>
      </div>

      {/* Progress bar */}
      <div className={`h-2.5 rounded-full overflow-hidden ${track}`}>
        <div
          className={`h-full ${bar} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className={`text-xs ${text} mt-2 text-right`}>
        {checklistsCompleted} / {checklistsTotal} lista završeno
      </p>
    </div>
  );
}
