import { IApi, PostUvData } from "./IApi";

interface MockData {
  images: string[];
  uvs: {name: string, uv: number[][]}[];
  files: string[];
}

export class MockApi implements IApi {
  private readonly mockData: MockData = {
    images: [],
    uvs: [],
    files: []
  };

  requestPostImage(blob: Blob, fileName: string) {
    const blobUrl = URL.createObjectURL(blob);
    this.mockData.images.push(blobUrl);

    return new Promise(res => res());
  };

  requestPostUV(json: PostUvData) {
    this.mockData.uvs.push(json);
    return new Promise(res => res());
  };

  requestGet<T>(url: string) {
    let response: any = null;
    if (url.indexOf("/uv?name=") > -1) {
      const name = url.replace("/uv?name=", "");
      const uv = this.mockData.uvs.find(uv => uv.name === name);
      response = uv.uv;
    } else if (url.indexOf("/uv-list") > -1) {
      response = this.mockData.uvs.map(uv => uv.name);
    } else if (url.indexOf("/images") > -1) {
      response = { images: this.mockData.images, files: this.mockData.files };
    }
    return new Promise<T>(res => res(JSON.parse(JSON.stringify(response))));
  }
}
