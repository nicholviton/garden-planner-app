import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlantType } from '@/types/plantType';
import { computeHarvestDate, getSeedInfo, getTransplantInfo } from '@/types/plantType';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function toPercent(dateStr: string, year: number): number {
  const d = new Date(dateStr + 'T00:00:00');
  const yearStart = new Date(year, 0, 1);
  const totalDays = isLeapYear(year) ? 366 : 365;
  const dayNum = (d.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.min(100, (dayNum / totalDays) * 100));
}

interface PlantTypeTimelineProps {
  plantTypes: PlantType[];
}

export function PlantTypeTimeline({ plantTypes }: PlantTypeTimelineProps) {
  const [year, setYear] = useState(new Date().getFullYear());

  if (plantTypes.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-12">
        No plant types yet.
      </p>
    );
  }

  const rows = plantTypes
    .filter((pt) => pt.year === year)
    .map((pt) => {
      const seedInfo = getSeedInfo(pt);
      const transplantInfo = getTransplantInfo(pt);
      const harvestDateStr = computeHarvestDate(pt);
      return { pt, seedInfo, transplantInfo, harvestDateStr };
    })
    .filter(({ seedInfo, transplantInfo, harvestDateStr }) =>
      seedInfo !== null || transplantInfo !== null || harvestDateStr !== null,
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Year selector */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Previous year"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-base font-semibold text-gray-800 w-12 text-center">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Next year"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Month axis */}
          <div className="flex pl-40 mb-1 select-none">
            {MONTHS.map((m) => (
              <div key={m} className="flex-1 text-xs text-gray-400 text-center">{m}</div>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 pl-40">
              No plant types with dates for {year}.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {rows.map(({ pt, seedInfo, transplantInfo, harvestDateStr }, rowIdx) => {
                const seedPct       = seedInfo       ? toPercent(seedInfo.date,       year) : null;
                const transplantPct = transplantInfo ? toPercent(transplantInfo.date, year) : null;
                const harvestPct    = harvestDateStr ? toPercent(harvestDateStr,      year) : null;

                return (
                  <div
                    key={pt.id}
                    className={`flex items-center py-1.5 ${rowIdx % 2 === 1 ? 'bg-gray-50' : ''}`}
                  >
                    {/* Plant name */}
                    <div className="w-40 flex-shrink-0 pr-3 flex items-center gap-1.5 min-w-0">
                      <span
                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: pt.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 truncate">{pt.plantName}</span>
                    </div>

                    {/* Timeline bar */}
                    <div className="flex-1 relative h-8">
                      {/* Month grid lines */}
                      {MONTHS.map((_, i) => (
                        <div
                          key={i}
                          className="absolute inset-y-0 w-px bg-gray-100"
                          style={{ left: `${(i / 12) * 100}%` }}
                        />
                      ))}

                      {/* Baseline */}
                      <div className="absolute top-1/2 inset-x-0 h-px bg-gray-200" />

                      {/* Indoor bar: seed → transplant */}
                      {seedPct !== null && transplantPct !== null && transplantPct > seedPct && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-garden-300 rounded-l-full"
                          style={{ left: `${seedPct}%`, width: `${transplantPct - seedPct}%` }}
                          title={`Indoors: ${seedInfo!.date} → ${transplantInfo!.date}`}
                        />
                      )}

                      {/* Garden bar: transplant → harvest */}
                      {transplantPct !== null && harvestPct !== null && harvestPct > transplantPct && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-earth-300 rounded-r-full"
                          style={{ left: `${transplantPct}%`, width: `${harvestPct - transplantPct}%` }}
                          title={`Garden: ${transplantInfo!.date} → ${harvestDateStr}`}
                        />
                      )}

                      {/* Single bar: seed → harvest (no transplant) */}
                      {seedPct !== null && transplantPct === null && harvestPct !== null && harvestPct > seedPct && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-garden-200 rounded-full"
                          style={{ left: `${seedPct}%`, width: `${harvestPct - seedPct}%` }}
                          title={`Growing: ${seedInfo!.date} → ${harvestDateStr}`}
                        />
                      )}

                      {/* Garden bar: transplant → harvest with no seed */}
                      {seedPct === null && transplantPct !== null && harvestPct !== null && harvestPct > transplantPct && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-earth-300 rounded-full"
                          style={{ left: `${transplantPct}%`, width: `${harvestPct - transplantPct}%` }}
                          title={`Garden: ${transplantInfo!.date} → ${harvestDateStr}`}
                        />
                      )}

                      {/* Seed marker */}
                      {seedPct !== null && (
                        <div
                          className={[
                            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10',
                            seedInfo!.source === 'actual'
                              ? 'bg-garden-600'
                              : 'bg-white border-2 border-garden-500',
                          ].join(' ')}
                          style={{ left: `${seedPct}%` }}
                          title={`Seed (${seedInfo!.source}): ${seedInfo!.date}`}
                        />
                      )}

                      {/* Transplant marker */}
                      {transplantPct !== null && (
                        <div
                          className={[
                            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10',
                            transplantInfo!.source === 'actual'
                              ? 'bg-sky-500'
                              : 'bg-white border-2 border-sky-500',
                          ].join(' ')}
                          style={{ left: `${transplantPct}%` }}
                          title={`Transplant (${transplantInfo!.source}): ${transplantInfo!.date}`}
                        />
                      )}

                      {/* Harvest marker (rotated diamond) */}
                      {harvestPct !== null && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-earth-500 border-2 border-white shadow-sm z-10"
                          style={{ left: `${harvestPct}%` }}
                          title={`Harvest: ${harvestDateStr}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 pl-40 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-3 rounded-sm bg-garden-300" />
              Indoors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-3 rounded-sm bg-earth-300" />
              Garden
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-garden-600 border-2 border-white shadow-sm" />
              Seed (actual)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-white border-2 border-garden-500 shadow-sm" />
              Seed (planned)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-sky-500 border-2 border-white shadow-sm" />
              Transplant (actual)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-500 shadow-sm" />
              Transplant (planned)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rotate-45 bg-earth-500 border-2 border-white shadow-sm" />
              Harvest
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
