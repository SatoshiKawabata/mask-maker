import * as React from "react";
import { ScanView } from "./ScanView";
import { AvatarView } from "./AvatarView";
import "./TabList.css";
import { ScanFaceView } from "./ScanFaceView";

const KEY_CODE = {
  LEFT: 37,
  RIGHT: 39,
  ONE: 49,
  TWO: 50,
  THREE: 51
};

export class Tablist extends React.Component<{}, {
  view: "avatar"
}> {
  constructor(props: {}) {
    super(props);
    this.state = {
      view: "avatar"
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", e => {
      switch (e.keyCode) {
        // case KEY_CODE.ONE:
        //   e.stopPropagation();
        //   e.preventDefault();
        //   this.setState({ view: "scan" });
        // break;
        case KEY_CODE.TWO:
          e.stopPropagation();
          e.preventDefault();
          this.setState({ view: "avatar" });
          break;
        // case KEY_CODE.THREE:
        //   e.stopPropagation();
        //   e.preventDefault();
        //   this.setState({ view: "scan-face" });
        //   break;
      }
    });
  }

  render() {
    return (
      <div>
        {/* <div className="tab-list">
          <button
            className="tab"
            disabled={this.state.view === "scan"}
            onClick={() => this.onChangeTab("scan")}>Scan</button>
          <button
            className="tab"
            disabled={this.state.view === "avatar"}
            onClick={() => this.onChangeTab("avatar")}>Avatar</button>
          <button
            className="tab"
            disabled={this.state.view === "scan-face"}
            onClick={() => this.onChangeTab("scan-face")}>Scan Face</button>
        </div> */}
        <div>
          {
            renderView(this.state.view)
          }
        </div>
      </div>
    );
  }

  // private readonly onChangeTab = (view: "scan" | "avatar" | "scan-face") => {
  //   localStorage.setItem("tab-view", view);
  //   this.setState({ view });
  // }
}

const renderView = (view: "scan" | "avatar" | "scan-face") => {
  switch (view) {
    case "avatar":
      return <AvatarView />;
    case "scan":
      return <ScanView />;
    case "scan-face":
      return <ScanFaceView />;
  }
}
