'use client';

import { useEffect, useState } from 'react';
import {
  applySeedSync,
  previewSeedSync,
  type SeedSyncPreview,
} from '@/lib/stores';
import BottomSheet from './BottomSheet';

interface SeedSyncPanelProps {
  onClose: () => void;
}

export default function SeedSyncPanel({ onClose }: SeedSyncPanelProps) {
  const [preview, setPreview] = useState<SeedSyncPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [includeUpdates, setIncludeUpdates] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    previewSeedSync()
      .then(setPreview)
      .catch((nextError) =>
        setError(nextError instanceof Error ? nextError.message : 'Preview failed')
      )
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async () => {
    if (!preview) return;
    setApplying(true);
    setError('');
    try {
      const result = await applySeedSync(preview, includeUpdates);
      setMessage(
        `Added ${result.added} and updated ${result.updated} shop${
          result.added + result.updated === 1 ? '' : 's'
        }.`
      );
      setPreview(await previewSeedSync());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Sync failed');
    } finally {
      setApplying(false);
    }
  };

  return (
    <BottomSheet title="Sync seed data" onClose={onClose}>
      {loading && <div className="skeleton h-28 rounded-xl" />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {preview && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            New outlets are added automatically. Existing records are never
            overwritten unless you explicitly include seed updates here.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <SeedCount label="Missing" value={preview.missing.length} />
            <SeedCount label="Changed" value={preview.changed.length} />
            <SeedCount label="Matching" value={preview.unchanged} />
          </div>
          {preview.missing.length > 0 && (
            <div>
              <h3 className="text-sm font-bold">Will add</h3>
              <ul className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {preview.missing.map((shop) => (
                  <li key={shop.name}>• {shop.name}</li>
                ))}
              </ul>
            </div>
          )}
          {preview.changed.length > 0 && (
            <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
              <input
                type="checkbox"
                checked={includeUpdates}
                onChange={(event) => setIncludeUpdates(event.target.checked)}
                className="mt-1 h-5 w-5"
              />
              <span>
                Update address or coordinates for {preview.changed.length}{' '}
                existing shop{preview.changed.length === 1 ? '' : 's'} from the
                seed file.
              </span>
            </label>
          )}
          {message && (
            <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">
              {message}
            </p>
          )}
          <button
            type="button"
            onClick={handleApply}
            disabled={
              applying ||
              (preview.missing.length === 0 &&
                (!includeUpdates || preview.changed.length === 0))
            }
            className="min-h-12 w-full rounded-xl bg-teal-700 font-bold text-white disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {applying ? 'Syncing…' : 'Apply seed sync'}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

function SeedCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
      <strong className="block text-xl">{value}</strong>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
