export function haptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  switch (style) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(20);
      break;
    case 'heavy':
      navigator.vibrate(40);
      break;
    case 'success':
      navigator.vibrate([10, 50, 20]);
      break;
    case 'error':
      navigator.vibrate([50, 30, 50]);
      break;
  }
}
