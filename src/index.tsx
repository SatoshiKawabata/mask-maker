import * as React from "react";
import * as ReactDOM from "react-dom";
import { Tablist } from "./components/TabList";
import { ApiDelegate } from "./util/ApiDelegate";
// import { Api } from "./api/api";
import { MockApi } from "./api/MockApi";

ApiDelegate.api = new MockApi();

ReactDOM.render(
  <Tablist />,
document.getElementById('app'));
