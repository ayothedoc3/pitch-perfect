import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '../components/ui/Navigation';
import PitchCard from '../components/pitch/PitchCard';
import { usePitchStore, mapPitchDetailToStorePitch } from '../stores/pitchStore';
import type { PitchDetail } from '../services/SpeechUploadService';
import { pitchesAPI } from '../lib/api';

export default function PitchesPage() {
  const router = useRouter();
  const pitches = usePitchStore((state) => state.pitches);
  const setPitches = usePitchStore((state) => state.setPitches);

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    let cancelled = false;

    const fetchPitches = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await pitchesAPI.getAll(1, 50);
        const normalized = (response.pitches || []).map((pitch: PitchDetail) => mapPitchDetailToStorePitch(pitch));
        if (!cancelled) {
          setPitches(normalized);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load pitches';
          setFetchError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPitches();

    return () => {
      cancelled = true;
    };
  }, [setPitches]);

  const filteredPitches = useMemo(() => {
    return pitches.filter((pitch) => (filter === 'all' ? true : pitch.type === filter));
  }, [pitches, filter]);

  const sortedPitches = useMemo(() => {
    return [...filteredPitches].sort((a, b) => {
      switch (sortBy) {
        case 'duration':
          return b.duration - a.duration;
        case 'feedback':
          return (b.feedbackCount || 0) - (a.feedbackCount || 0);
        case 'date':
        default:
          return new Date(b.createdAt || b.dateRecorded || '').getTime() - new Date(a.createdAt || a.dateRecorded || '').getTime();
      }
    });
  }, [filteredPitches, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>Pitches | PitchBuddy</title>
      </Head>

      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Pitches</h1>
            <p className="text-gray-600 mt-2">Review your recorded pitches and track your progress over time.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/practice')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Practice a New Pitch
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="all">All</option>
              <option value="startup">Startup</option>
              <option value="elevator">Elevator</option>
              <option value="sales">Sales</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="date">Most Recent</option>
              <option value="duration">Duration</option>
              <option value="feedback">Feedback Count</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="p-8 text-center text-blue-600 bg-blue-50 border border-blue-100 rounded-lg">
            Loading your pitches...
          </div>
        )}

        {fetchError && !isLoading && (
          <div className="p-6 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p>{fetchError}</p>
          </div>
        )}

        {!isLoading && sortedPitches.length === 0 && !fetchError && (
          <div className="p-8 text-center bg-white border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No pitches yet</h2>
            <p className="text-gray-600 mb-4">
              Start by recording your first pitch. You will see it listed here once analysis is complete.
            </p>
            <button
              onClick={() => router.push('/practice')}
              className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Practice Now
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedPitches.map((pitch) => (
            <PitchCard key={pitch.id} {...pitch} />
          ))}
        </div>
      </main>
    </div>
  );
}

