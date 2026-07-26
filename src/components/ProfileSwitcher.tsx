'use client';

import type { UserProfile } from '@/lib/types';
import { haptic } from '@/lib/haptics';

const LABELS: Record<UserProfile, string> = {
  amirul: 'Amirul',
  barbie: 'Barbie',
  together: 'Together',
};

interface ProfileSwitcherProps {
  value: UserProfile;
  onChange: (profile: UserProfile) => void;
}

export default function ProfileSwitcher({
  value,
  onChange,
}: ProfileSwitcherProps) {
  return (
    <label className="profile-switcher">
      <span className="sr-only">Active profile</span>
      <select
        aria-label="Active profile"
        value={value}
        onChange={(event) => {
          haptic('light');
          onChange(event.target.value as UserProfile);
        }}
      >
        {(Object.keys(LABELS) as UserProfile[]).map((profile) => (
          <option key={profile} value={profile}>
            {LABELS[profile]}
          </option>
        ))}
      </select>
    </label>
  );
}
