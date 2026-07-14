'use client';

import { useSettingsStore } from '@/stores/settings-store';
import { CloudRain, Type } from 'lucide-react';

export default function AccessibilityToggle() {
  const accessibilityMode = useSettingsStore((s) => s.accessibilityMode);
  const fontSizeMultiplier = useSettingsStore((s) => s.fontSizeMultiplier);
  const setAccessibilityMode = useSettingsStore((s) => s.setAccessibilityMode);
  const toggleRainMode = useSettingsStore((s) => s.toggleRainMode);
  const toggleLargeText = useSettingsStore((s) => s.toggleLargeText);

  return (
    <div className="card-elevated p-5">
      <h3 className={`font-semibold mb-4 text-xs uppercase tracking-wider text-gray-500`}>Accessibility Settings</h3>

      {/* Rain Mode Toggle (UR-079) */}
      <button
        onClick={toggleRainMode}
        className={`w-full flex items-center justify-between rounded-xl border p-4 mb-3 transition ${
          accessibilityMode === 'rain-mode' ? 'border-gaa-green ring-2 ring-gaa-green bg-green-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <CloudRain className={`w-5 h-5 ${accessibilityMode === 'rain-mode' ? 'text-gaa-green' : ''}`} />
          <span className={`font-medium text-sm ${accessibilityMode === 'rain-mode' ? 'text-gray-900 font-semibold' : ''}`}>🌧️ Rain Mode</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accessibilityMode === 'rain-mode' ? 'bg-gaa-green text-white' : 'bg-gray-100 text-gray-600'}`}>
          {accessibilityMode === 'rain-mode' ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Large Text Toggle */}
      <button
        onClick={toggleLargeText}
        className={`w-full flex items-center justify-between rounded-xl border p-4 transition ${
          accessibilityMode === 'large-text' ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <Type className={`w-5 h-5 ${accessibilityMode === 'large-text' ? 'text-blue-600' : ''}`} />
          <span className={`font-medium text-sm ${accessibilityMode === 'large-text' ? 'text-gray-900 font-semibold' : ''}`}>🔤 Large Text</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accessibilityMode === 'large-text' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {accessibilityMode === 'large-text' ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Feature descriptions */}
      <div className={`mt-4 pt-3 border-t ${'border-gray-200'} space-y-1.5`}>
        <p className={`text-xs text-gray-600`}><strong>Rain Mode:</strong> High visibility in wet conditions, large touch targets</p>
        <p className={`text-xs text-gray-600`}><strong>Large Text:</strong> 25% larger fonts and buttons</p>
      </div>
    </div>
  );
}
