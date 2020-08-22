import {
  SoundContext,
  createOscillator,
  whiteNoise,
  distortionCurve,
} from "./util";
import { Random } from "../random";

export const enum Scale {
  CMinor = 0,
  DMinor = 1,
  EMinor = 2,
  FMinor = 3,
  GMinor = 4,
  AMinor = 5,
  BMinor = 6,
}

export interface DubinatorOptions {
  bpm: number;
  gain: number;
  scale: Scale;
  rng: Random;
}

export interface InstrumentOptions {
  gain?: number;
  filterFrequency?: number;
  scale?: Scale;
}

export interface KickOptions extends InstrumentOptions {
  frequencyStart?: number;
  frequency?: number;
  decay?: number;
  pitchDecay?: number;
  distortion?: number;
  wave?: OscillatorType;
}

export interface BassOptions extends InstrumentOptions {
  wave?: OscillatorType;
}

export interface StabOptions extends InstrumentOptions {}
export interface NoiseOptions extends InstrumentOptions {
  filterType?: BiquadFilterType;
  attack?: number;
  decay?: number;
}

export abstract class Instrument<T extends InstrumentOptions> {
  protected _ctx: SoundContext;
  protected _gain: number;
  protected _volume: GainNode;
  protected _scale?: Scale;

  constructor(ctx: SoundContext, opts?: T) {
    this._ctx = ctx;
    this._gain = opts?.gain ?? 1;
    this._scale = opts?.scale ?? Scale.GMinor;
    this._volume = ctx.createGain();
    this._volume.gain.setValueAtTime(this._gain, ctx.currentTime);
  }

  public connect(
    destinationNode: AudioNode,
    output?: number,
    input?: number
  ): AudioNode {
    return this._volume.connect(destinationNode, output, input);
  }

  public start() {
    this._volume.gain.value = 0;
  }

  public stop() {
    this._volume.gain.value = this._gain;
  }

  public abstract trigger(time: number): void;
}

export class Noise extends Instrument<NoiseOptions> {
  private _filter: BiquadFilterNode;
  private _attack: number;
  private _decay: number;
  private _filterFrequency: number;

  constructor(ctx: SoundContext, opts?: NoiseOptions) {
    super(ctx, opts);
    this._filter = ctx.createBiquadFilter();
    this._filter.type = opts?.filterType ?? "bandpass";
    this._filterFrequency = opts?.filterFrequency ?? 2000;
    this._filter.frequency.value = this._filterFrequency;
    this._attack = opts?.attack ?? 0.001;
    this._decay = opts?.decay ?? 0.2;
    this._gain = 0.4;
  }

  public trigger(time: number) {
    this._filterFrequency = this._filterFrequency + Math.random() * 50;
    const noise = whiteNoise(this._ctx);
    noise.connect(this._filter).connect(this._volume);
    this._volume.gain.setValueAtTime(0, time);
    this._volume.gain.exponentialRampToValueAtTime(
      this._gain,
      time + this._attack
    );
    this._volume.gain.exponentialRampToValueAtTime(
      0.01,
      time + this._attack + this._decay
    );
    noise.start(time);
    noise.stop(time + this._attack + this._decay);
  }
}

export class Kick extends Instrument<KickOptions> {
  private _frequencyStart: number;
  private _frequency: number;
  private _decay: number;
  private _pitchDecay: number;
  private _distortion: number;
  private _distortionCurve: Float32Array;
  private _wave: OscillatorType;

  constructor(ctx: SoundContext, opts?: KickOptions) {
    super(ctx, opts);
    this._frequency = opts?.frequency ?? 49;
    this._frequencyStart = opts?.frequencyStart ?? 196;
    this._pitchDecay = opts?.pitchDecay ?? 0.06;
    this._decay = opts?.decay ?? 0.6;
    this._distortion = opts?.distortion ?? 4;
    this._distortionCurve = distortionCurve(this._ctx, this._distortion);
    this._wave = opts?.wave ?? "sine";
  }

  public set distortion(value: number) {
    this._distortion = value;
    this._distortionCurve = distortionCurve(this._ctx, this._distortion);
  }

  public set pitchPeak(value: number) {
    this._frequencyStart = value;
  }

  public set pitch(value: number) {
    this._frequency = value;
  }

  public set pitchDecay(value: number) {
    this._pitchDecay = value;
  }

  public set decay(value: number) {
    this._decay = value;
  }

  trigger(time: number) {
    const osc = this._ctx.createOscillator();
    osc.type = this._wave;
    osc.frequency.value = this._frequencyStart;
    osc.frequency.linearRampToValueAtTime(
      this._frequency,
      time + this._pitchDecay
    );

    const waveShaper = this._ctx.createWaveShaper();
    waveShaper.curve = this._distortionCurve;

    const triangleGainNode = this._ctx.createGain();
    triangleGainNode.gain.value = 1;
    triangleGainNode.gain.linearRampToValueAtTime(0.01, time + this._decay);

    osc.connect(waveShaper);
    waveShaper.connect(triangleGainNode);
    triangleGainNode.connect(this._volume);

    osc.start(time);
    osc.stop(time + this._decay + 0.4);
  }
}

export class Bass extends Instrument<BassOptions> {
  private _wave: OscillatorType;
  private _filter: BiquadFilterNode;
  private _filterFrequency: number;

  constructor(ctx: SoundContext, opts?: BassOptions) {
    super(ctx, opts);
    this._filterFrequency = opts?.filterFrequency ?? 800;
    this._wave = opts?.wave ?? "sine";
    this._filter = ctx.createBiquadFilter();
    this._filter.type = "lowpass";
    this._filter.frequency.value = this._filterFrequency;
  }
  public trigger(time: number, freqency?: number) {
    const osc = this._ctx.createOscillator();
    osc.type = this._wave;
    osc.frequency.value = freqency ?? 196.0;
    osc.connect(this._filter).connect(this._volume);
  }
}

export class Stab extends Instrument<StabOptions> {
  constructor(ctx: SoundContext, opts?: StabOptions) {
    super(ctx, opts);
  }
  public trigger(time: number) {
    throw new Error("Method not implemented.");
  }
}

export class Dubinator {
  private _isPlaying: boolean = false;
  private _gain: number;
  private _volume: GainNode;
  private _bpm: number;
  private _secondsPerBeat: number;
  private _currentBeat: number = 0;
  private _nextNoteTime: number = 0;
  private _lookahead: number = 25;
  private _scheduleAheadTime: number = 0;
  public kick: Instrument<KickOptions>;
  private _bass: Instrument<BassOptions>;
  private _stab: Instrument<StabOptions>;
  private _noise: Instrument<NoiseOptions>;
  private _scale: Scale;
  private _rng: Random;
  private _timerID?: number;
  public ctx: SoundContext;

  public get isPlaying() {
    return this._isPlaying;
  }

  constructor(ctx: SoundContext, opts?: DubinatorOptions) {
    this.ctx = ctx;
    this._bpm = opts?.bpm ?? 120;
    this._secondsPerBeat = 60 / (this._bpm * 4);
    this._rng = opts?.rng ?? new Random("404");
    this._gain = opts?.gain ?? 1;
    this._volume = ctx.createGain();
    this._volume.gain.setValueAtTime(this._gain, ctx.currentTime);
    this._scale = opts?.scale ?? Scale.GMinor;
    this.kick = new Kick(ctx, { scale: this._scale });
    this.kick.connect(this._volume);

    this._bass = new Bass(ctx, { scale: this._scale });
    this._bass.connect(this._volume);

    this._stab = new Stab(ctx, { scale: this._scale });
    this._stab.connect(this._volume);

    this._noise = new Noise(ctx);
    this._noise.connect(this._volume);

    this._volume.connect(ctx.destination);
  }

  private _scheduleTrigger(time: number) {
    let log = this._currentBeat.toString();
    if (this._currentBeat % 4 === 0) {
      log += " kick";
      this.kick.trigger(time);
    }
    if ((this._currentBeat + 2) % 4 === 0) {
      log += " shake";
      this._noise.trigger(time);
    }
    console.log(log);
  }

  private _nextNote() {
    this._currentBeat++;
    this._currentBeat = this._currentBeat % 16;
    this._nextNoteTime += this._secondsPerBeat;
  }

  private _scheduler() {
    while (
      this._nextNoteTime <
      this.ctx.currentTime + this._scheduleAheadTime
    ) {
      this._scheduleTrigger(this._nextNoteTime);
      this._nextNote();
    }
    this._timerID = window.setTimeout(
      this._scheduler.bind(this),
      this._lookahead
    );
  }

  public togglePlay() {
    this._isPlaying = !this._isPlaying;
    window.clearTimeout(this._timerID);
    if (this._isPlaying) {
      this._volume.gain.exponentialRampToValueAtTime(
        this._gain,
        this.ctx.currentTime + this._secondsPerBeat
      );
      window.setTimeout(this._scheduler.bind(this), this._secondsPerBeat);
    } else {
      this._volume.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + this._secondsPerBeat
      );
      this._nextNoteTime = 0;
      this._currentBeat = 0;
    }
  }

  public getVolume() {
    return this._volume.gain.value;
  }

  public setVolume(ctx: SoundContext, volume: number, time?: number) {
    this._volume.gain.setValueAtTime(volume, time ?? ctx.currentTime);
  }
}
