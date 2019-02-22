import * as React from "react";
import { DeviceSelector } from "./DeviceSelector";
import { clearOverlay } from "./AvatarView";
import { getNow, video2Canvas, requestPostImage } from "./ScanView";
import { ClmtrackrWrapper } from "./ClmtrackrWrapper";

interface State {
  zoom: number;
  isSaving: boolean;
  fileName: string;
}
export class ScanFaceView extends React.Component<{}, State> {
  private animationFrameId: number;
  private clmWrapper: ClmtrackrWrapper;

  constructor(props: any) {
    super(props);
    this.clmWrapper = new ClmtrackrWrapper();

    this.state = {
      zoom: Number(localStorage.getItem("avatar-zoom") || "1"),
      isSaving: false,
      fileName: null
    };
  }

  componentDidMount() {
    const webGLContext = (this.refs.webgl as HTMLCanvasElement).getContext("webgl");
    webGLContext.viewport(0, 0, webGLContext.canvas.width, webGLContext.canvas.height);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animationFrameId);
    this.clmWrapper.destructor();
  }

  render() {
    return <div>
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
      <button onClick={async () => {
        this.setState({ isSaving: true });
        const positions = this.clmWrapper.getCurrentPosition();
        const canvas = await video2Canvas(this.refs.video as HTMLVideoElement, false);
        const name = getNow();
        await requestPostJSON<{name: string, uv: number[][]}>({
          name,
          uv: positions
        }, "/uv");
        canvas.toBlob(async b => {
          await requestPostImage(b, name, "/images");
          this.setState({
            isSaving: false,
            fileName: name
          });
          localStorage.setItem("last-saved-mask-name", name + ".png");
        });
      }} disabled={this.state.isSaving}>save</button>
      {
        this.state.fileName
          ? <span>{this.state.fileName}</span>
          : null
      }
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
      </div>
    </div>;
  }

  private onReadyVideo = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    this.clmWrapper.start(this.refs.video as HTMLVideoElement);
    this.drawGridLoop();
  }

  private restartTracking = () => {
    cancelAnimationFrame(this.animationFrameId);
    clearOverlay(this.refs.overlay as HTMLCanvasElement);
    this.clmWrapper.start(this.refs.video as HTMLVideoElement);
    this.drawGridLoop();
  }

  private drawGridLoop = () => {
    const positions = this.clmWrapper.getCurrentPosition();
    const overlay = this.refs.overlay as HTMLCanvasElement
    clearOverlay(this.refs.overlay as HTMLCanvasElement);
    if (positions) {
      // draw current grid
      this.clmWrapper.drawPositions(overlay);
    }
    this.animationFrameId = requestAnimationFrame(this.drawGridLoop);
  }
}

function requestPostJSON<T>(json: T, url: string) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(json));
  return new Promise((res, rej) => {
    xhr.onload = () => {
      res();
    };
    xhr.onerror = () => {
      res("error");
    };
  });
};
