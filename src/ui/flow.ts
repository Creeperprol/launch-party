import type { App } from '../app';
import { CharSelectScene } from './charSelect';
import { ControlsScene } from './controls';
import { MainMenuScene } from './mainMenu';
import { MatchScene, type MatchConfig, type MatchResult } from './matchScene';
import { ResultsScene } from './results';
import { Session } from './session';
import { SettingsScene } from './settingsScene';
import { StageSelectScene } from './stageSelect';
import { TitleScene } from './title';

/** Screen-to-screen navigation for the whole game loop. */
export class Flow {
  app: App;
  session = new Session();

  constructor(app: App) {
    this.app = app;
  }

  title(instant = false): void {
    const s = new TitleScene(this);
    if (instant) this.app.setScene(s);
    else this.app.goto(s);
  }

  menu(): void {
    this.app.goto(new MainMenuScene(this));
  }

  controls(): void {
    this.app.goto(new ControlsScene(this));
  }

  settings(): void {
    this.app.goto(new SettingsScene(this));
  }

  charSelect(): void {
    this.app.goto(new CharSelectScene(this));
  }

  stageSelect(): void {
    this.app.goto(new StageSelectScene(this));
  }

  match(cfg: MatchConfig): void {
    this.app.goto(new MatchScene(cfg, (r) => (r === 'quit' ? this.charSelect() : this.results(r))));
  }

  rematch(): void {
    const last = this.session.last;
    if (!last) {
      this.charSelect();
      return;
    }
    this.match({ ...last, seed: this.session.seed++ });
  }

  results(r: MatchResult): void {
    this.app.goto(new ResultsScene(this, r));
  }
}
