import * as React from "react";
import "./ScanView.css";
import { facemodel_numbering_new } from "./consts";

export class ScanView extends React.Component<{}, {
  devices: MediaDeviceInfo[],
  selectedDevice: MediaDeviceInfo,
  snapshotSrc: string,
  snapshotName: string,
  snapshotBlob: Blob,
  uploadState: "none" | "uploading" | "success" | "failed",
  isVideoReverse: boolean
}> {
  constructor(props: {}) {
    super(props);
    this.state = {
      devices: [],
      selectedDevice: null,
      snapshotSrc: "",
      snapshotName: "",
      snapshotBlob: null,
      uploadState: "none",
      isVideoReverse: false
    };
  }

  componentWillMount() {
    navigator.mediaDevices.enumerateDevices().then(deviceList => {
      console.log("deviceList", deviceList);
      const devices = deviceList.filter(d => d.kind === "videoinput");
      const lastSelectedId = localStorage.getItem("scan-view-camera-device-id");
      const selected = devices.find(d => d.deviceId === lastSelectedId) || devices[0];
      this.setState({
        devices,
        selectedDevice: selected
      });

      // videoタグにカメラ画像を表示させる
      setUserMedia(selected.deviceId).then(stream => {
        try {
          (this.refs.video as HTMLVideoElement).srcObject = stream;
        } catch {
          (this.refs.video as HTMLVideoElement).src = URL.createObjectURL(stream);
        }
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
                <p>upload state: {this.state.uploadState}</p>
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
    if (this.state.isVideoReverse) {
      context.translate(canvas.width,0);
      context.scale(-1,1);
    }
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    this.setState({
      snapshotSrc: canvas.toDataURL('image/png'),
      uploadState: "none"
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
    setUserMedia(d.deviceId).then(stream => {
      localStorage.setItem("scan-view-camera-device-id", d.deviceId);
      try {
        (this.refs.video as HTMLVideoElement).srcObject = stream;
      } catch {
        (this.refs.video as HTMLVideoElement).src = URL.createObjectURL(stream);
      }
    });
  }

  private onClickSave = async () => {
    this.setState({
      uploadState: "uploading"
    });
    const err = await requestPostImage(this.state.snapshotBlob, this.state.snapshotName);
    // autocomplete dataset
    const names = JSON.parse(localStorage.getItem("snapshot-names") || "[]");
    names.push(this.state.snapshotName);
    names.sort();
    localStorage.setItem("snapshot-names", JSON.stringify(names));
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
  xhr.open("POST", "./images", true);
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
