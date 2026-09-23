import { App } from './app';
import { NOVA, SABLE } from './content/fighters';
import { CROWN_RUINS } from './content/stages';
import { MatchScene } from './ui/matchScene';

const canvas = document.getElementById('game') as HTMLCanvasElement;

function devMatch(): MatchScene {
  return new MatchScene(
    {
      slots: [
        { slot: 0, device: 'kb1', cpu: 0, fighter: NOVA, palette: 0 },
        { slot: 1, device: 'kb2', cpu: 0, fighter: SABLE, palette: 0 },
      ],
      stage: CROWN_RUINS,
      rules: { stocks: 3, time: 7, items: 2 },
      seed: 1,
    },
    () => app.setScene(devMatch()),
  );
}

const app = new App(canvas, devMatch());
app.start();
