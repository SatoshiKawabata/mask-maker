const clm = require("../../clmtrackr/build/clmtrackr");
const { pModel } = require("../../clmtrackr/models/model_pca_20_svm");

export class ClmtrackrWrapper {
  private ctrack: any;

  constructor() {
    this.ctrack = new clm.tracker();
    this.ctrack.init(pModel);
  }

  destructor() {
    this.ctrack.stop();
    delete this.ctrack;
  }

  start(video: HTMLVideoElement) {
    this.ctrack.stop();
    this.ctrack.reset();
    this.ctrack.start(video);
  }

  drawPositions(canvas: HTMLCanvasElement) {
    this.ctrack.draw(canvas);
  }

  getCurrentPosition(): number[][] {
    return this.ctrack.getCurrentPosition();
  }

  getConvergence(): number {
    return this.ctrack.getConvergence();
  }
}
