'use client';

import { useTheme } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

export default function AboutTab() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <span className="text-5xl block mb-3">🏪</span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Thrift Tracker</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          v1.1
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">About</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          A map-based check-in tool for optimizing thrift store and bundle shop visits.
          Tracks time since last visit to prevent frequenting the same spots too soon,
          and recommends shops based on distance and history.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">Theme</h3>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                haptic('light');
                setTheme(t);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all capitalize ${
                resolvedTheme === t || (t === 'system' && false)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {t === 'light' && '☀️ '}
              {t === 'dark' && '🌙 '}
              {t === 'system' && '💻 '}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">Features</h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Map-based check-in with vibe ratings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Editable visit history for Amirul, Barbie, or both</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Adventure &amp; Lazy recommendation modes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Thrift Crawl route planning</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>BOLO wishlist with check-in reminders</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Deduplicated CSV and seed-data sync</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Offline support with Firebase persistence</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Geofencing auto-check-in prompts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Dark mode with outdoor high contrast</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>PWA - installable to home screen</span>
          </li>
        </ul>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'Firebase', 'Leaflet.js', 'OpenStreetMap'].map(
            (tech) => (
              <span
                key={tech}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg"
              >
                {tech}
              </span>
            )
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center pb-4">
        Built for you &amp; Barbie
      </p>
    </div>
  );
}
