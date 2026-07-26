'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { importShops } from '@/lib/stores';
import { haptic } from '@/lib/haptics';
import BottomSheet from './BottomSheet';

interface CsvImportProps {
  onClose: () => void;
  onComplete: () => void;
}

interface CsvRow {
  name?: string;
  title?: string;
  latitude?: string;
  longitude?: string;
  lat?: string;
  lng?: string;
  lon?: string;
  address?: string;
  [key: string]: string | undefined;
}

export default function CsvImport({ onClose, onComplete }: CsvImportProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    haptic('medium');
    const text = await file.text();
    const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });

    const errors: string[] = [];
    const validRows: Array<{
      name: string;
      address?: string;
      lat: number;
      lng: number;
    }> = [];

    for (const row of parsed.data) {
      const name = row.name || row.title || row.Name || row.Title;
      const lat =
        parseFloat(row.latitude || row.lat || row.Latitude || row.Lat || '0') || 0;
      const lng =
        parseFloat(
          row.longitude || row.lng || row.lon || row.Longitude || row.Lng || row.Lon || '0'
        ) || 0;
      const address = row.address || row.Address || '';

      if (!name) {
        errors.push(`Skipping row: no name found`);
        continue;
      }

      if (lat === 0 && lng === 0) {
        errors.push(`Skipping "${name}": no valid coordinates`);
        continue;
      }

      validRows.push({ name: name.trim(), lat, lng, address: address || undefined });
    }

    try {
      const outcome = await importShops(validRows);
      if (outcome.skipped > 0) {
        errors.push(
          `Skipped ${outcome.skipped} duplicate shop${
            outcome.skipped === 1 ? '' : 's'
          }`
        );
      }
      haptic('success');
      setResult({ imported: outcome.added, errors });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Import failed');
      setResult({ imported: 0, errors });
      haptic('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet onClose={onClose} title="Import CSV">
      {!result ? (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Upload a CSV file exported from Google Maps. Expected columns:
            name/title, latitude/lat, longitude/lng/lon, address.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={() => {
              haptic('light');
              fileRef.current?.click();
            }}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Importing...' : 'Select CSV File'}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl">
            <p className="text-sm text-green-800 dark:text-green-200">
              Successfully imported {result.imported} shop
              {result.imported !== 1 ? 's' : ''}
            </p>
          </div>

          {result.errors.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Warnings ({result.errors.length}):
              </p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-yellow-700 dark:text-yellow-300">
                  {err}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              haptic('light');
              onComplete();
              onClose();
            }}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
