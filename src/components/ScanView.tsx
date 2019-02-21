import * as React from "react";
import "./ScanView.css";
import { facemodel_numbering_new } from "./consts";
import { DeviceSelector } from "./DeviceSelector";

export class ScanView extends React.Component<{}, {
  snapshotSrc: string,
  snapshotName: string,
  snapshotBlob: Blob,
  uploadState: "none" | "uploading" | "success" | "failed",
  isVideoReverse: boolean
}> {
  constructor(props: {}) {
    super(props);
    this.state = {
      snapshotSrc: "",
      snapshotName: "",
      snapshotBlob: null,
      uploadState: "none",
      isVideoReverse: false
    };
  }

  render() {
    return (
      <div>
        <DeviceSelector
          cameraWidth={1280}
          cameraHeight={720}
          defaultId={localStorage.getItem("scan-view-camera-device-id")}
          onChangeDevice={({ stream, info }) => {
            localStorage.setItem("scan-view-camera-device-id", info.deviceId);
            try {
              (this.refs.video as HTMLVideoElement).srcObject = stream;
            } catch {
              (this.refs.video as HTMLVideoElement).src = URL.createObjectURL(stream);
            }
          }} />
        <input
          type="checkbox"
          name=""
          id="is-video-reverse"
          checked={this.state.isVideoReverse}
          onChange={() => this.setState({ isVideoReverse: !this.state.isVideoReverse })} />
        <label htmlFor="is-video-reverse">Reverse</label>
        <div className="scan-view__container">
          <video
            className={this.state.isVideoReverse ? "scan-view__video--reverse" : ""}
            onCanPlay={this.onVideoCanPlay}
            ref="video"
            autoPlay />
          <img className="scan-view__template" src={facemodel_numbering_new} ref="template"/>
        </div>
        <button type="button" onClick={this.onClickSnapShotAndSave}>SnapShotAndSave</button>
        <button type="button" onClick={this.onClickSnapShot}>SnapShot</button>
        {
          this.state.snapshotSrc
            ? <div>
                <input
                  className="scan-view__snapshot-name"
                  type="text"
                  value={this.state.snapshotName}
                  onInput={e => this.setState({ snapshotName: (e.target as HTMLInputElement).value }) }
                  list="snapshotNames"
                  autoComplete="on"/>
                <datalist id="snapshotNames">
                  {
                    JSON.parse(localStorage.getItem("snapshot-names") || "[]").map((val: string) => <option value={val} key={val} />)
                  }
                </datalist>
                <button type="button" onClick={this.onClickSave} disabled={!this.state.snapshotBlob || !this.state.snapshotName}>Save</button>
                <p>upload state: {this.state.uploadState}</p>
                <img src={this.state.snapshotSrc} />
              </div> : null
        }
      </div>
    );
  }

  private onClickSnapShotAndSave = async () => {
    await this.onClickSnapShot();
    this.setState({
      snapshotName: getNow()
    });
    await this.save(this.state.snapshotBlob, this.state.snapshotName);
    localStorage.setItem("last-saved-mask-name", this.state.snapshotName + ".png");
  }

  private onClickSnapShot = async () => {
    const blob = await this.createBlob();
    this.setState({ snapshotBlob: blob });
  }

  private createBlob = () => {
    const video = this.refs.video as HTMLVideoElement;
    const canvas = video2Canvas(video, this.state.isVideoReverse);
    this.setState({
      snapshotSrc: canvas.toDataURL('image/png'),
      uploadState: "none"
    });
    return new Promise<Blob>(resolve => canvas.toBlob(resolve));
  }

  private onVideoCanPlay = () => {
    (this.refs.template as HTMLImageElement).height = (this.refs.video as HTMLVideoElement).videoHeight;
  }

  private onClickSave = async () => {
    await this.save(this.state.snapshotBlob, this.state.snapshotName);
    // autocomplete dataset
    const names = JSON.parse(localStorage.getItem("snapshot-names") || "[]");
    names.push(this.state.snapshotName);
    names.sort();
    localStorage.setItem("snapshot-names", JSON.stringify(names));
  }

  private save = async (blob: Blob, fileName: string) => {
    this.setState({
      uploadState: "uploading"
    });
    const err = await requestPostImage(blob, fileName, "./images");
    if (err) {
      window.alert("upload failed");
      this.setState({
        uploadState: "failed"
      });
    } else {
      this.setState({
        uploadState: "success"
      });
    }
  }
}

const requestPostImage = async (blob: Blob, fileName: string, url: string) => {
  const form = new FormData();
  form.append("image", blob, fileName);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.send(form);
  return new Promise((res, rej) => {
    xhr.onload = () => {
      res();
    };
    xhr.onerror = () => {
      res("error");
    };
  })
};

const addZero = (num: number) => {
  if (num < 10) {
    return `0${num}`;
  }
  return num + "";
}

const video2Canvas = (video: HTMLVideoElement, isReverse: boolean = false) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  if (isReverse) {
    context.translate(canvas.width,0);
    context.scale(-1,1);
  }
  context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  return canvas;
}

const getNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${addZero(d.getMonth() + 1)}-${addZero(d.getDate())} ${addZero(d.getHours())}-${addZero(d.getMinutes())}-${addZero(d.getSeconds())}`;
}
