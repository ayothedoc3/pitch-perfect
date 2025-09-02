import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface SkillMetric {
  category: string;
  score: number;
  previousScore?: number;
}

interface SkillRadarChartProps {
  metrics: SkillMetric[];
  title?: string;
}

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ 
  metrics, 
  title = 'Skill Assessment' 
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    const labels = metrics.map(m => m.category);
    const currentData = metrics.map(m => m.score);
    const previousData = metrics.map(m => m.previousScore || 0);
    const hasPreviousData = metrics.some(m => m.previousScore !== undefined);
    
    chartInstance.current = new Chart(ctx, {
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
          ...(hasPreviousData ? [{
            label: 'Previous',
            data: previousData,
            backgroundColor: 'rgba(156, 163, 175, 0.2)',
            borderColor: 'rgba(156, 163, 175, 1)',
            pointBackgroundColor: 'rgba(156, 163, 175, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(156, 163, 175, 1)',
          }] : []),
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
  }, [metrics]);
  
  // Calculate improvement metrics
  const improvements = metrics
    .filter(m => m.previousScore !== undefined && m.score > m.previousScore)
    .map(m => ({
      category: m.category,
      improvement: m.previousScore ? ((m.score - m.previousScore) / m.previousScore) * 100 : 0,
    }));
  
  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      <div className="h-80 mb-4">
        <canvas ref={chartRef}></canvas>
      </div>
      
      {improvements.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Improvements</h4>
          <div className="space-y-1">
            {improvements.map(imp => (
              <div key={imp.category} className="flex items-center text-sm">
                <span className="font-medium text-gray-700">{imp.category}:</span>
                <span className="ml-2 text-green-600">+{imp.improvement.toFixed(0)}%</span>
                <div className="ml-2 flex-grow h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${Math.min(imp.improvement, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillRadarChart; 