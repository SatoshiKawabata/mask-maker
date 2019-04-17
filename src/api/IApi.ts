export interface PostUvData {
  name: string;
  uv: number[][];
}

export interface IApi {
  requestGet: <T>(url: string) => Promise<T>;
  requestPostImage: (blob: Blob, fileName: string) => Promise<{}>;
  requestPostUV: (json: PostUvData) => Promise<{} | string>;
  getImageSrc: (path: string) => string;
}
