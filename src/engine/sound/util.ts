export type SoundContext = AudioContext | OfflineAudioContext;

export function createCustomOscillator(
  ctx: SoundContext,
  wave: PeriodicWave,
  frequency?: number
): OscillatorNode {
  const osc = createOscillator(ctx, "custom");
  osc.setPeriodicWave(wave);
  osc.frequency.value = frequency ?? 440;
  return osc;
}

export function createOscillator(
  ctx: SoundContext,
  type?: OscillatorType,
  frequency?: number
): OscillatorNode {
  const osc = ctx.createOscillator();
  if (type) {
    osc.type = type;
  }
  if (frequency) {
    osc.frequency.value = frequency;
  }
  return osc;
}

let _whiteNoiseBuffer: AudioBuffer | undefined;

export function whiteNoise(ctx: SoundContext): AudioBufferSourceNode {
  const bufferSize = 2 * ctx.sampleRate;
  if (!_whiteNoiseBuffer || _whiteNoiseBuffer.length !== bufferSize) {
    _whiteNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = _whiteNoiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = _whiteNoiseBuffer;
  whiteNoise.loop = true;
  return whiteNoise;
}

export function distortionCurve(ctx: SoundContext, amount: number) {
  const numberOfSamples = ctx.sampleRate;
  const curve = new Float32Array(numberOfSamples);
  const deg = Math.PI / 180;
  for (let i = 0; i < numberOfSamples; ++i) {
    const x = (i * 2) / numberOfSamples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export function noteToFrequency(stepsFromRoot: number, root: number = 440) {
  return root * Math.pow(Math.pow(2, 1 / 12), stepsFromRoot);
}

export async function loadAudioWorklet(ctx: SoundContext, source: string) {
  const processorBlob = new Blob([source], { type: "text/javascript" });
  const processorURL = URL.createObjectURL(processorBlob);
  await ctx.audioWorklet.addModule(processorURL);
}
