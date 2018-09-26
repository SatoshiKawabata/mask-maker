import * as React from "react";
import { ScanView } from "./ScanView";
import { AvatarView } from "./AvatarView";
import "./TabList.css";

export class Tablist extends React.Component<{}, {
  view: "scan" | "avatar"
}> {
  constructor(props: {}) {
    super(props);
    this.state = {
      view: localStorage.getItem("tab-view") as "scan" | "avatar" || "scan"
    };
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
