let contextoAudio: AudioContext | null = null;

/**
 * Beep corto para el feedback de cada escaneo. En un local con
 * ruido el sonido importa más que el destello visual, así que esto
 * no depende de ningún archivo de audio: un tono generado alcanza.
 */
export function reproducirBeep() {
  try {
    contextoAudio ??= new AudioContext();
    const osc = contextoAudio.createOscillator();
    const ganancia = contextoAudio.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;
    ganancia.gain.setValueAtTime(0.2, contextoAudio.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.1);

    osc.connect(ganancia);
    ganancia.connect(contextoAudio.destination);
    osc.start();
    osc.stop(contextoAudio.currentTime + 0.1);
  } catch {
    // Sin Web Audio (o bloqueado): no interrumpe la venta.
  }
}
