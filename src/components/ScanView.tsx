import * as React from "react";
import "./ScanView.css";
import { facemodel_numbering_new } from "./consts";

export class ScanView extends React.Component<{}, {
  devices: MediaDeviceInfo[],
  selectedDevice: MediaDeviceInfo,
  videoSrc: MediaStream,
  snapshotSrc: string,
  snapshotName: string,
  snapshotBlob: Blob
}> {
  constructor(props: {}) {
    super(props);
    this.state = {
      devices: [],
      selectedDevice: null,
      videoSrc: null,
      snapshotSrc: "",
      snapshotName: "",
      snapshotBlob: null
    };

    navigator.mediaDevices.enumerateDevices().then(deviceList => {
      console.log("deviceList", deviceList);
      const devices = deviceList.filter(d => d.kind === "videoinput");
      const selected = devices[0];
      this.setState({
        devices,
        selectedDevice: selected
      });

      // videoタグにカメラ画像を表示させる
      setUserMedia(selected.deviceId).then(stream => {
        this.setState({ videoSrc: stream });
      });
    });
  }

  render() {
    return (
      <div>
        <select onChange={this.onChangeDevice}>
          {
            this.state.devices.map(device => {
              return <option
                value={device.deviceId}
                defaultValue={device.deviceId}
                key={device.deviceId}>
                {device.label}
              </option>
            })
          }
        </select>
        <div className="scan-view__container">
          <video
            className="scan-view__video"
            src={this.state.videoSrc ? URL.createObjectURL(this.state.videoSrc) : ""}
            onCanPlay={this.onVideoCanPlay}
            ref="video"
            autoPlay />
          <img className="scan-view__template" src={facemodel_numbering_new} ref="template"/>
        </div>
        <button type="button" onClick={this.onClickSnapShot}>SnapShot</button>
        {
          this.state.snapshotSrc
            ? <div>
                <input
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
                <img src={this.state.snapshotSrc} />
              </div> : null
        }
      </div>
    );
  }

  private onClickSnapShot = () => {
    const video = this.refs.video as HTMLVideoElement;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.translate(canvas.width,0);
    context.scale(-1,1);
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    this.setState({
      snapshotSrc: canvas.toDataURL('image/png')
    });
    canvas.toBlob(blob => {
      this.setState({
        snapshotBlob: blob
      });
    });
  }

  private onVideoCanPlay = () => {
    (this.refs.template as HTMLImageElement).height = (this.refs.video as HTMLVideoElement).videoHeight;
  }

  private onChangeDevice = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const d = this.state.devices.filter(d => d.deviceId === e.target.value)[0];
    this.setState({ selectedDevice: d });
    setUserMedia(this.state.selectedDevice.deviceId).then(stream => {
      this.setState({ videoSrc: stream });
    });
  }

  private onClickSave = async () => {
    await requestPostImage(this.state.snapshotBlob, this.state.snapshotName);
    // autocomplete dataset
    const names = JSON.parse(localStorage.getItem("snapshot-names") || "[]");
    names.push(this.state.snapshotName);
    names.sort();
    localStorage.setItem("snapshot-names", JSON.stringify(names));
  }
}

const setUserMedia = (deviceId: string) => {
  return navigator.mediaDevices.getUserMedia({
    video: {
      deviceId,
      width: 1280,
      height: 720
    },
    audio: false
  });
};

const requestPostImage = async (blob: Blob, fileName: string) => {
  const form = new FormData();
  form.append("image", blob, fileName);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:1234/images", true);
  xhr.send(form);
  return new Promise((res, rej) => {
    xhr.onload = () => {
      res();
    };
    xhr.onerror = () => {
      rej();
    };
  })
};
