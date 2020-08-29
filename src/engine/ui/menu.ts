import { ISettings, Settings } from "./../../settings";
export class Menu {
  private _menu: HTMLDivElement;
  private _hidden = true;
  private _settings: Settings;

  constructor(settings: Settings) {
    this._settings = settings;
    this._menu = document.createElement("div");
    this._menu.id = "menu";
    this._menu.className = "modal";

    let title = document.createElement("h1");
    title.innerText = "404: this world does not exist";

    let toggles = this.setupToggles(settings);

    this._menu.appendChild(title);
    this._menu.appendChild(toggles);
  }

    private setupToggles(settings: Settings) {
        let toggles = document.createElement("fieldset");
        toggles.className = "toggles";

        let crtDiv = document.createElement("div");
        let crtToggle = document.createElement("button");
        crtToggle.type = "button";
        crtToggle.setAttribute("aria-pressed", this._settings.crtOn.toString());
        crtToggle.innerText = "CRT Effect";
        crtToggle.addEventListener("click", () => {
            let status = crtToggle.getAttribute("aria-pressed") === "true";
            if (status) {
                crtToggle.setAttribute("aria-pressed", "false");
                settings.crtOn = false;
            }
            else {
                crtToggle.setAttribute("aria-pressed", "true");
                settings.crtOn = true;
            }
        });
        crtDiv.appendChild(crtToggle);

        let asciiDiv = document.createElement("div");
        let asciiToggle = document.createElement("button");
        asciiToggle.type = "button";
        asciiToggle.setAttribute("aria-pressed", this._settings.asciiOn.toString());
        asciiToggle.innerText = "ASCII Effect";
        asciiToggle.addEventListener("click", () => {
            let status = asciiToggle.getAttribute("aria-pressed") === "true";
            if (status) {
                asciiToggle.setAttribute("aria-pressed", "false");
                settings.asciiOn = false;
            }
            else {
                asciiToggle.setAttribute("aria-pressed", "true");
                settings.asciiOn = true;
            }
        });
        asciiDiv.appendChild(asciiToggle);

        toggles.appendChild(asciiDiv);
        toggles.appendChild(crtDiv);
        return toggles;
    }

  toggleMenu() {
    this._hidden = !this._hidden;
    if (this._hidden) {
      document.body.removeChild(this._menu);
    } else {
      document.body.appendChild(this._menu);
    }
  }
}
