'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { addShop } from '@/lib/stores';

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
    const text = await file.text();
    const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });

    const errors: string[] = [];
    let imported = 0;

    for (const row of parsed.data) {
      // Try various column name combinations
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

      try {
        await addShop({
          name,
          lat,
          lng,
          address: address || undefined,
        });
        imported++;
      } catch {
        errors.push(`Failed to import "${name}"`);
      }
    }

    setResult({ imported, errors });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 mobile-modal-overlay z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[88dvh] overflow-y-auto safe-area-bottom">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Import CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {!result ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
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
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Importing...' : 'Select CSV File'}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Successfully imported {result.imported} shop
                {result.imported !== 1 ? 's' : ''}
              </p>
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-h-40 overflow-y-auto">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Warnings ({result.errors.length}):
                </p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-yellow-700">
                    {err}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
