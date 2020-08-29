const GAME_PREFIX = "MEIDOR-404";

export interface ISettings {
  crtOn: boolean;
  asciiOn: boolean;
}

const settingsUpdated = new CustomEvent<void>("settingsupdated");

export class Settings implements ISettings {
  private _crtOn: boolean = false;
  private _asciiOn: boolean = false;

  constructor() {
    this.load();
  }

  public get crtOn() {
    return this._crtOn;
  }

  public set crtOn(value: boolean) {
    this._crtOn = value;
    this._save();
  }

  public get asciiOn() {
    return this._asciiOn;
  }

  public set asciiOn(value: boolean) {
    this._asciiOn = value;
    this._save();
  }

  public load() {
    this._crtOn =
      (localStorage.getItem(GAME_PREFIX + "crtOn") ?? "false") === "true";
    this._asciiOn =
      (localStorage.getItem(GAME_PREFIX + "asciiOn") ?? "false") === "true";
  }

  private _save() {
    localStorage.setItem(GAME_PREFIX + "crtOn", this._crtOn.toString());
    localStorage.setItem(GAME_PREFIX + "asciiOn", this._asciiOn.toString());
    document.dispatchEvent(settingsUpdated);
  }
}
