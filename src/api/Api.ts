import { IApi, PostUvData } from "./IApi";

export class Api implements IApi {
  requestPostImage(blob: Blob, fileName: string) {
    const form = new FormData();
    form.append("image", blob, fileName);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/images", true);
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

  requestPostUV(json: PostUvData) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/uv", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(json));
    return new Promise<{} | string>((res, rej) => {
      xhr.onload = () => {
        res();
      };
      xhr.onerror = () => {
        res("error");
      };
    });
  };

  requestGet<T>(url: string) {
    return new Promise<T>((res, rej) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url);
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

}
