import * as React from "react";
import * as ReactDOM from "react-dom";
import { Tablist } from "./components/TabList";
import { ApiDelegate } from "./util/ApiDelegate";
import { Api } from "./api/api";

ApiDelegate.api = new Api();

ReactDOM.render(
  <Tablist />,
document.getElementById('app'));
