import * as React from "react";
import { SNAP_SHOT_UV_MAP, DEFAULT_IMAEGS } from "./consts";

export interface Mask {
  path: string,
  name: string,
  uvMap: number[][],
  image: HTMLImageElement;
};

const createMask = (path: string, name: string, uvMap: number[][]): Mask => {
  const img = document.createElement("img");
  img.src = path;
  return {
    path,
    name,
    image: img,
    uvMap
  };
};

export const DEFAULT_MASKS: Mask[] = DEFAULT_IMAEGS.map(({path, uvMap, name}) => createMask(path, name, uvMap));

export class MaskSelector extends React.Component<{
  onChange: (mask: Mask) => void;
  selectedMask: Mask;
}, {
  masks: Mask[];
  selectedMask: Mask;
}> {
  constructor(props: any) {
    super(props);
    this.state = {
      masks: [
        ...DEFAULT_MASKS
      ],
      selectedMask: this.props.selectedMask
    };
  }

  async componentWillMount() {
    const { files } = await requestGetImages();
    const masks = files.map(path => createMask(`http://localhost:1234/files/${path}`, path, SNAP_SHOT_UV_MAP));
    console.log("files", masks);
    this.setState({
      masks: [
        ...masks,
        ...DEFAULT_MASKS
      ]
    });
  }

  render() {
    return (
      <div>
        <select onChange={(e) => {
            console.log(e.target.value);
            const mask = this.findMask(e.target.value);
            this.props.onChange(mask);
          }}>
          {
            this.state.masks.map(mask => {
              return (
                <option
                  value={mask.path}
                  key={mask.path}
                  defaultValue={this.state.selectedMask.path}>{mask.name}</option>
              )
            })
          }
        </select>
        {/* <input type="file" multiple accept=".jpg, .jpeg, .png" onChange={this.onChangeFiles} /> */}
      </div>
    );
  }

  // private readonly onChangeFiles = (e: React.ChangeEvent) => {
  //   const { files } = e.target as HTMLInputElement
  //   const masks: Mask[] = [];
  //   for (let i = 0; i < files.length; i++) {
  //     const path = `./snapshots/${files[i].name}`;
  //     masks.push(createMask(path));
  //   }
  //   localStorage.setItem("snapshot-paths", JSON.stringify(masks.map(mask => mask.path)));
  //   this.setState({
  //     masks: [
  //       ...DEFAULT_MASKS,
  //       ...masks
  //     ]
  //   });
  // }

  private readonly findMask = (path: string) => {
    return this.state.masks.find(mask => mask.path === path);
  }
}

const requestGetImages = async () => {
  return new Promise<{ files: string[] }>((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:1234/images");
    xhr.responseType = "json";
    xhr.onload = () => {
      res(xhr.response);
    };
    xhr.onerror = () => {
      rej();
    };
    xhr.send();
  })
};