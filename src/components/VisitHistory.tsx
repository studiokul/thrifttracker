'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CheckIn, Shop, UserProfile, Vibe } from '@/lib/types';
import {
  deleteCheckIn,
  subscribeToCheckIns,
  updateCheckIn,
} from '@/lib/stores';
import BottomSheet from './BottomSheet';
import { haptic } from '@/lib/haptics';

const PROFILE_LABELS: Record<string, string> = {
  user1: 'Amirul',
  amirul: 'Amirul',
  barbie: 'Barbie',
  together: 'Together',
};

const VIBE_LABELS: Record<Vibe, string> = {
  fire: '🔥 Fire',
  mid: '😐 Mid',
  drop: '🗑️ Drop',
};

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

interface VisitHistoryProps {
  shops: Shop[];
}

export default function VisitHistory({ shops }: VisitHistoryProps) {
  const [visits, setVisits] = useState<CheckIn[]>([]);
  const [filter, setFilter] = useState<'all' | UserProfile>('all');
  const [editing, setEditing] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    return subscribeToCheckIns(
      (next) => {
        setVisits(next);
        setLoading(false);
        setError('');
      },
      (nextError) => {
        setLoading(false);
        setError(nextError.message);
      }
    );
  }, []);

  const shopNames = useMemo(
    () => new Map(shops.map((shop) => [shop.id, shop.name])),
    [shops]
  );
  const filtered = visits.filter((visit) => {
    if (filter === 'all') return true;
    if (filter === 'amirul') {
      return visit.userId === 'amirul' || visit.userId === 'user1';
    }
    return visit.userId === filter;
  });

  if (loading) {
    return <div className="skeleton h-32 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Visit history
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {visits.length} check-in{visits.length === 1 ? '' : 's'}
          </p>
        </div>
        <select
          aria-label="Filter visit history by profile"
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as 'all' | UserProfile)
          }
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-base dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="all">Everyone</option>
          <option value="amirul">Amirul</option>
          <option value="barbie">Barbie</option>
          <option value="together">Together</option>
        </select>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          History could not sync: {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No visits for this profile yet.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((visit) => (
            <article
              key={visit.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {visit.shopName ||
                      shopNames.get(visit.shopId) ||
                      'Archived shop'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {visit.timestamp.toLocaleString('en-MY', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {' · '}
                    {PROFILE_LABELS[visit.userId] || visit.userId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(visit)}
                  className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-bold dark:border-slate-600"
                >
                  Edit
                </button>
              </div>
              <p className="mt-3 text-sm font-medium">{VIBE_LABELS[visit.vibe]}</p>
              {visit.notes && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {visit.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {editing && (
        <EditVisitSheet visit={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function EditVisitSheet({
  visit,
  onClose,
}: {
  visit: CheckIn;
  onClose: () => void;
}) {
  const [timestamp, setTimestamp] = useState(toLocalInput(visit.timestamp));
  const [vibe, setVibe] = useState<Vibe>(visit.vibe);
  const [notes, setNotes] = useState(visit.notes || '');
  const [userId, setUserId] = useState<UserProfile>(
    visit.userId === 'barbie' || visit.userId === 'together'
      ? visit.userId
      : 'amirul'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateCheckIn(visit.id, {
        timestamp: new Date(timestamp),
        vibe,
        notes: notes.trim() || undefined,
        userId,
      });
      haptic('success');
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this check-in? The shop totals will be recalculated.')) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await deleteCheckIn(visit.id);
      haptic('success');
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Delete failed');
      setSaving(false);
    }
  };

  return (
    <BottomSheet title="Edit visit" onClose={onClose}>
      <div className="space-y-4">
        <label className="block text-sm font-medium">
          Date and time
          <input
            type="datetime-local"
            value={timestamp}
            onChange={(event) => setTimestamp(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        <label className="block text-sm font-medium">
          Profile
          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value as UserProfile)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="amirul">Amirul</option>
            <option value="barbie">Barbie</option>
            <option value="together">Together</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Vibe
          <select
            value={vibe}
            onChange={(event) => setVibe(event.target.value as Vibe)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="fire">🔥 Fire</option>
            <option value="mid">😐 Mid</option>
            <option value="drop">🗑️ Drop</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleDelete}
            className="min-h-12 rounded-xl border border-red-300 font-bold text-red-700 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            disabled={saving || !timestamp}
            onClick={handleSave}
            className="min-h-12 rounded-xl bg-teal-700 font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
