import { App } from './app';
import { Flow } from './ui/flow';
import { TitleScene } from './ui/title';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const placeholder = { name: 'boot', update() {}, render() {} };
const app = new App(canvas, placeholder);
const flow = new Flow(app);
app.setScene(new TitleScene(flow));
app.start();
