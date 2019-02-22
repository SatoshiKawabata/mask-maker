import * as React from "react";
import "./AvatarView.css";
import { Mask, MaskSelector, DEFAULT_MASKS } from "./Masks";
import { DeviceSelector } from "./DeviceSelector";
const clm = require("../../clmtrackr/build/clmtrackr");
const { pModel } = require("../../clmtrackr/models/model_pca_20_svm");

declare const faceDeformer: any;

interface State {
  isTracking: boolean;
  zoom: number;
}
export class AvatarView extends React.Component<{}, State> {
  private selectedMask: Mask = DEFAULT_MASKS[0];
  private animationFrameId: number;

  private ctrack: any;
  private faceDeformer: any;

  constructor(props: any) {
    super(props);
    this.ctrack = new clm.tracker();
    this.ctrack.init(pModel);
    this.faceDeformer = new faceDeformer();

    this.state = {
      isTracking: false,
      zoom: Number(localStorage.getItem("avatar-zoom") || "1")
    };
  }

  shouldComponentUpdate(nextProps: {}, nextState: State): boolean {
    const zoomChanged = this.state.zoom !== nextState.zoom;
    if (zoomChanged) {
      localStorage.setItem("avatar-zoom", nextState.zoom.toString());
    }
    return this.state.isTracking !== nextState.isTracking || zoomChanged;
  }

  componentDidMount() {
    const webGLContext = (this.refs.webgl as HTMLCanvasElement).getContext("webgl");
    webGLContext.viewport(0, 0, webGLContext.canvas.width, webGLContext.canvas.height);
    this.faceDeformer.init(this.refs.webgl);
  }

  componentWillUnmount() {
    this.faceDeformer.clear();
    this.ctrack.stop();
    cancelAnimationFrame(this.animationFrameId);
    delete this.ctrack;
    delete this.faceDeformer;
  }

  render() {
    return (
      <div>
        <button type="button" onClick={this.restartTracking}>restart</button>
        <DeviceSelector
          defaultId={localStorage.getItem("avatar-view-camera-device-id")}
          cameraWidth={400}
          cameraHeight={300}
          onChangeDevice={({ stream, info }) => {
            localStorage.setItem("avatar-view-camera-device-id", info.deviceId);
            try {
              (this.refs.video as HTMLVideoElement).srcObject = stream;
            } catch {
              (this.refs.video as HTMLVideoElement).src = URL.createObjectURL(stream);
            }
          }} />
        <MaskSelector onChange={mask => {
          this.selectedMask = mask;
          this.faceDeformer.load(mask.image, mask.uvMap, pModel);
        }} selectedMask={this.selectedMask}/>
        <input type="button" value="+" onClick={() => this.setState({ zoom: this.state.zoom + 0.05 })} />
        <input type="button" value="-" onClick={() => this.setState({ zoom: this.state.zoom - 0.05 })} />
        <span>zoom: {this.state.zoom}</span>
        <span style={{marginLeft: "16px"}}>isTtacking: {this.state.isTracking.toString()}</span>
        <div id="container" className="avatar-view__container" style={{transform: `scale(${this.state.zoom})`}}>
          <video
            className="avatar-view__video"
            ref="video"
            width="400"
            height="300"
            preload="auto"
            playsInline={true}
            autoPlay={true}
            onCanPlay={this.onReadyVideo}
            >
          </video>
          <canvas ref="overlay" className="avatar-view__overlay" width="400" height="300"></canvas>
          <canvas ref="webgl" className="avatar-view__webgl" width="400" height="300"></canvas>
          {
            this.state.isTracking
              ? null
              : <p className="avatar-view__note">Don't move!</p>
          }
        </div>
      </div>
    );
  }

  private onReadyVideo = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    this.ctrack.stop();
    this.ctrack.reset();
    this.ctrack.start(this.refs.video);
    this.drawGridLoop();
  }

  private drawGridLoop = () => {
    const positions = this.ctrack.getCurrentPosition();
    const overlay = this.refs.overlay as HTMLCanvasElement
    this.clearOverlay();
    if (positions) {
      // draw current grid
      this.ctrack.draw(overlay);
    }
    // check whether mask has converged
    const pn = this.ctrack.getConvergence();
    // console.log(pn, this.ctrack.getScore())
    if (pn < 0.4) {
      this.faceDeformer.load(this.selectedMask.image, this.selectedMask.uvMap, pModel);
      this.animationFrameId = requestAnimationFrame(this.drawMaskLoop);
      this.setState({
        isTracking: false
      });
    } else {
      this.animationFrameId = requestAnimationFrame(this.drawGridLoop);
    }
  }

  private drawMaskLoop = () => {
    // get position of face
    const positions = this.ctrack.getCurrentPosition();
    // console.log(this.ctrack.getConvergence(), this.ctrack.getScore(), this.ctrack.getCurrentParameters())
    this.clearOverlay();
    if (positions) {
      // draw mask on top of face
      this.faceDeformer.draw(positions);
      this.setState({
        isTracking: true
      });
    }
    this.animationFrameId = requestAnimationFrame(this.drawMaskLoop);
  }

  private restartTracking = () => {
    cancelAnimationFrame(this.animationFrameId);
    this.clearOverlay();
    this.faceDeformer.clear();
    this.ctrack.stop();
    this.ctrack.reset();
    this.ctrack.start(this.refs.video);
    this.drawGridLoop();
    this.setState({
      isTracking: false
    });
  }

  private clearOverlay = () => {
    const overlay = this.refs.overlay as HTMLCanvasElement
    if (!overlay) {
      console.warn("no overlay");
      return;
    }
    ((overlay).getContext("2d") as CanvasRenderingContext2D).clearRect(0, 0, overlay.width, overlay.height);
  }
}
