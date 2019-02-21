import * as React from "react";
import { ScanView } from "./ScanView";
import { AvatarView } from "./AvatarView";
import "./TabList.css";

const KEY_CODE = {
  LEFT: 37,
  RIGHT: 39
};

export class Tablist extends React.Component<{}, {
  view: "scan" | "avatar"
}> {
  constructor(props: {}) {
    super(props);
    this.state = {
      view: localStorage.getItem("tab-view") as "scan" | "avatar" || "scan"
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", e => {
      switch (e.keyCode) {
        case KEY_CODE.LEFT:
          e.stopPropagation();
          e.preventDefault();
          this.setState({ view: "scan" });
        break;
        case KEY_CODE.RIGHT:
          e.stopPropagation();
          e.preventDefault();
          this.setState({ view: "avatar" });
          break;
      }
    });
  }

  render() {
    return (
      <div>
        <div className="tab-list">
          <button
            className="tab"
            disabled={this.state.view === "scan"}
            onClick={() => this.onChangeTab("scan")}>Scan</button>
          <button
            className="tab"
            disabled={this.state.view === "avatar"}
            onClick={() => this.onChangeTab("avatar")}>Avatar</button>
        </div>
        <div>
          {
            this.state.view === "scan"
              ? <ScanView />
              : <AvatarView />
          }
        </div>
      </div>
    );
  }

  private readonly onChangeTab = (view: "scan" | "avatar") => {
    localStorage.setItem("tab-view", view);
    this.setState({ view });
  }
}
