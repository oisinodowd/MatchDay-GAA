import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccessibilityMode = 'standard' | 'rain-mode' | 'high-contrast' | 'large-text';
export type VolunteerRole = 'volunteer' | 'coach' | 'administrator';

interface SettingsState {
  // Accessibility
  accessibilityMode: AccessibilityMode;
  fontSizeMultiplier: number;
  
  // Match Defaults
  defaultHalfDuration: number;
  defaultSport: 'gaelic-football' | 'hurling';
  extraTimeEnabled: boolean;
  
  // Volunteer Mode
  volunteerRole: VolunteerRole;
  isVolunteerMode: boolean;
  
  // Display
  showPitchMap: boolean;
  showTimeline: boolean;
  
  // Actions - Accessibility
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  toggleRainMode: () => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  setFontSizeMultiplier: (size: number) => void;
  
  // Actions - Match Defaults
  setDefaultHalfDuration: (duration: number) => void;
  setDefaultSport: (sport: 'gaelic-football' | 'hurling') => void;
  toggleExtraTime: () => void;
  
  // Actions - Volunteer Mode
  setVolunteerRole: (role: VolunteerRole) => void;
  toggleVolunteerMode: () => void;
  
  // Actions - Display
  setShowPitchMap: (show: boolean) => void;
  setShowTimeline: (show: boolean) => void;
  
  // Reset
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      accessibilityMode: 'standard',
      fontSizeMultiplier: 1,
      defaultHalfDuration: 30,
      defaultSport: 'gaelic-football',
      extraTimeEnabled: false,
      volunteerRole: 'volunteer',
      isVolunteerMode: false,
      showPitchMap: true,
      showTimeline: true,

      setAccessibilityMode: (accessibilityMode) => set({ accessibilityMode }),
      
      toggleRainMode: () => {
        const current = get().accessibilityMode;
        set({ 
          accessibilityMode: current === 'rain-mode' ? 'standard' : 'rain-mode',
          fontSizeMultiplier: current === 'rain-mode' ? 1 : 1.2
        });
      },
      
      toggleHighContrast: () => {
        const current = get().accessibilityMode;
        set({ 
          accessibilityMode: current === 'high-contrast' ? 'standard' : 'high-contrast'
        });
      },
      
      toggleLargeText: () => {
        const current = get().accessibilityMode;
        set({ 
          fontSizeMultiplier: current === 'large-text' ? 1 : 1.25,
          accessibilityMode: current === 'large-text' ? 'standard' : 'large-text'
        });
      },
      
      setFontSizeMultiplier: (fontSizeMultiplier) => set({ fontSizeMultiplier }),

      setDefaultHalfDuration: (defaultHalfDuration) => set({ defaultHalfDuration }),
      setDefaultSport: (defaultSport) => set({ defaultSport }),
      
      toggleExtraTime: () => {
        const { extraTimeEnabled } = get();
        set({ extraTimeEnabled: !extraTimeEnabled });
      },

      setVolunteerRole: (volunteerRole) => set({ volunteerRole }),
      
      toggleVolunteerMode: () => {
        const { isVolunteerMode, volunteerRole } = get();
        set({ 
          isVolunteerMode: !isVolunteerMode,
          volunteerRole: !isVolunteerMode ? 'coach' : volunteerRole
        });
      },

      setShowPitchMap: (showPitchMap) => set({ showPitchMap }),
      setShowTimeline: (showTimeline) => set({ showTimeline }),

      resetSettings: () => set({
        accessibilityMode: 'standard',
        fontSizeMultiplier: 1,
        defaultHalfDuration: 30,
        defaultSport: 'gaelic-football',
        extraTimeEnabled: false,
        volunteerRole: 'volunteer',
        isVolunteerMode: false,
        showPitchMap: true,
        showTimeline: true
      })
    }),
    {
      name: 'matchday-settings-storage'
    }
  )
);
