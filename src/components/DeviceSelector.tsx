import * as React from "react";

interface P {
    onChangeDevice: (d: { stream: MediaStream, info: MediaDeviceInfo }) => void;
    defaultId: string;
    cameraWidth: number;
    cameraHeight: number;
}
export class DeviceSelector extends React.Component<P, {
    devices: MediaDeviceInfo[],
    selectedDevice: MediaDeviceInfo,
}> {
    constructor(props: P) {
        super(props);
        this.state = {
            devices: [],
            selectedDevice: null
        };
    }

    async componentWillMount() {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const devices = deviceList.filter(d => d.kind === "videoinput");
        const selected = devices.find(d => d.deviceId === this.props.defaultId) || devices[0];
        this.setState({
          devices,
          selectedDevice: selected
        });

        const stream = await setUserMedia(this.props.cameraWidth, this.props.cameraHeight, selected.deviceId);
        this.props.onChangeDevice({ stream, info: selected });
    }
    render() {
        return <select onChange={this.onChange}>
            {
                this.state.devices.map(device => {
                    return <option
                      value={device.deviceId}
                      defaultValue={device.deviceId}
                      key={device.deviceId}
                      selected={device.deviceId === this.state.selectedDevice.deviceId}>
                      {device.label}
                    </option>
                  })
            }
        </select>;
    }

    private onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const d = this.state.devices.filter(d => d.deviceId === e.target.value)[0];
        this.setState({ selectedDevice: d });
        const stream = await setUserMedia(this.props.cameraWidth, this.props.cameraHeight, d.deviceId);
        this.props.onChangeDevice({ stream, info: d });
    }
}

const setUserMedia = (cameraWidth: number, cameraHeight: number, deviceId: string) => {
    return navigator.mediaDevices.getUserMedia({
      video: {
        deviceId,
        width: cameraWidth,
        height: cameraHeight
      },
      audio: false
    });
};
