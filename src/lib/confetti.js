import confetti from 'canvas-confetti';

const PAW_COLORS = ['#FF6B6B', '#FFB142', '#39B7F5', '#4ED9A4', '#A78BFA'];

/**
 * Fires a short, playful confetti burst — used to celebrate a pet's birthday
 * when the user opens the app.
 */
export function celebrateBirthday() {
  confetti({
    particleCount: 90,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: PAW_COLORS,
  });

  const end = Date.now() + 1200;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: PAW_COLORS });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: PAW_COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}