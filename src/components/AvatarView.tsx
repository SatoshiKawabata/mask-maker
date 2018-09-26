import * as React from "react";
import { Mask, MaskSelector, DEFAULT_MASKS } from "./Masks";
const clm = require("../../clmtrackr/build/clmtrackr");
const { pModel } = require("../../clmtrackr/models/model_pca_20_svm");
const faceDeformer = require("../../clmtrackr/examples/js/face_deformer");
const webglUtils = require("../../clmtrackr/examples/js/libs/webgl-utils");
Object.assign(window, webglUtils);

const ctrack = new clm.tracker();
ctrack.init(pModel);
const fd = new faceDeformer();

/**
 * ちゃんとキャプチャされるか試す
 */
export class AvatarView extends React.Component<{}, {
  videoSrc: string;
}> {
  private selectedMask: Mask = DEFAULT_MASKS[0];
  private animationFrameId: number;
  constructor(props: any) {
    super(props);
    this.state = {
      videoSrc: ""
    };
  }

  componentDidMount() {
    navigator
      .mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then(stream => {
        this.setState({
          videoSrc: URL.createObjectURL(stream)
        });
      });
  }

  render() {
    return (
      <div>
        <button type="button" onClick={this.restartTracking}>restart</button>
        <MaskSelector onChange={mask => {
          this.selectedMask = mask;
          fd.load(mask.image, mask.uvMap, pModel);
        }} selectedMask={this.selectedMask}/>
        <div id="container">
          <video
            className="video"
            ref="video"
            width="400"
            height="300"
            preload="auto"
            playsInline={true}
            autoPlay={true}
            onCanPlay={this.onReadyVideo}
            src={this.state.videoSrc}
            >
          </video>
          <canvas ref="overlay" className="overlay" width="400" height="300"></canvas>
          <canvas ref="webgl" className="webgl" width="400" height="300"></canvas>
        </div>
      </div>
    );
  }

  private onReadyVideo = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const webGLContext = (this.refs.webgl as HTMLCanvasElement).getContext("webgl");
    webGLContext.viewport(0, 0, webGLContext.canvas.width, webGLContext.canvas.height);
    fd.init(this.refs.webgl);
    ctrack.start(this.refs.video);
    this.drawGridLoop();
  }

  private drawGridLoop = () => {
    const positions = ctrack.getCurrentPosition();
    const overlay = this.refs.overlay as HTMLCanvasElement
    this.clearOverlay();
    if (positions) {
      // draw current grid
      ctrack.draw(overlay);
    }
    // check whether mask has converged
    const pn = ctrack.getConvergence();
    if (pn < 0.4) {
      fd.load(this.selectedMask.image, this.selectedMask.uvMap, pModel);
      this.animationFrameId = requestAnimationFrame(this.drawMaskLoop);
    } else {
      this.animationFrameId = requestAnimationFrame(this.drawGridLoop);
    }
  }

  private drawMaskLoop = () => {
    // get position of face
    const positions = ctrack.getCurrentPosition();
    this.clearOverlay();
    if (positions) {
      // draw mask on top of face
      fd.draw(positions);
    }
    this.animationFrameId = requestAnimationFrame(this.drawMaskLoop);
  }

  private restartTracking = () => {
    cancelAnimationFrame(this.animationFrameId);
    this.clearOverlay();
    fd.clear();
    ctrack.stop();
    ctrack.reset();
    ctrack.start(this.refs.video);
    this.drawGridLoop();
  }

  private clearOverlay = () => {
    const overlay = this.refs.overlay as HTMLCanvasElement
    if (!overlay) {
      return;
    }
    ((overlay).getContext("2d") as CanvasRenderingContext2D).clearRect(0, 0, overlay.width, overlay.height);
  }
}
