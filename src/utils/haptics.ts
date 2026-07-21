export function hapticLight() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
  } catch {
    // ignore
  }
}

export function hapticSuccess() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 40, 10]);
    }
  } catch {
    // ignore
  }
}

export function hapticError() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([20, 60, 20, 60]);
    }
  } catch {
    // ignore
  }
}
