import React, { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';

interface SkillMetric {
  category: string;
  score: number;
  previousScore?: number;
}

interface SkillRadarChartProps {
  metrics?: SkillMetric[];
  title?: string;
}

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  metrics = [],
  title = 'Skill Assessment',
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const sanitizedMetrics = useMemo(() => {
    if (!Array.isArray(metrics)) {
      return [];
    }

    return metrics.filter((metric) => {
      const hasValidCategory = typeof metric?.category === 'string' && metric.category.length > 0;
      const hasValidScore = typeof metric?.score === 'number' && Number.isFinite(metric.score);
      return hasValidCategory && hasValidScore;
    });
  }, [metrics]);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    if (sanitizedMetrics.length === 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
      return;
    }

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const context = chartRef.current.getContext('2d');
    if (!context) {
      return;
    }

    const labels = sanitizedMetrics.map((metric) => metric.category);
    const currentData = sanitizedMetrics.map((metric) => metric.score);
    const previousData = sanitizedMetrics.map((metric) => metric.previousScore ?? 0);
    const hasPreviousData = sanitizedMetrics.some((metric) => metric.previousScore !== undefined);

    chartInstance.current = new Chart(context, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Current',
            data: currentData,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
          },
          ...(hasPreviousData
            ? [
                {
                  label: 'Previous',
                  data: previousData,
                  backgroundColor: 'rgba(156, 163, 175, 0.2)',
                  borderColor: 'rgba(156, 163, 175, 1)',
                  pointBackgroundColor: 'rgba(156, 163, 175, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(156, 163, 175, 1)',
                },
              ]
            : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
            },
          },
        },
        animation: {
          duration: 1500,
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [sanitizedMetrics]);

  const improvements = sanitizedMetrics
    .filter(
      (metric) => metric.previousScore !== undefined && metric.score > (metric.previousScore ?? 0)
    )
    .map((metric) => ({
      category: metric.category,
      improvement:
        metric.previousScore && metric.previousScore !== 0
          ? ((metric.score - metric.previousScore) / metric.previousScore) * 100
          : 0,
    }));

  const shouldShowChart = sanitizedMetrics.length > 0;

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      <div className="h-80 mb-4">
        {shouldShowChart ? (
          <canvas ref={chartRef}></canvas>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-md">
            Not enough data yet. Record a pitch to see your skill breakdown.
          </div>
        )}
      </div>

      {improvements.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Improvements</h4>
          <div className="space-y-1">
            {improvements.map((improvement) => {
              const widthPercent = Math.min(Math.max(improvement.improvement, 0), 100);
              return (
                <div key={improvement.category} className="flex items-center text-sm">
                  <span className="font-medium text-gray-700">{improvement.category}:</span>
                  <span className="ml-2 text-green-600">+{improvement.improvement.toFixed(0)}%</span>
                  <div className="ml-2 flex-grow h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${widthPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillRadarChart;
