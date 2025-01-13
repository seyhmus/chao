import Compressor from "compressorjs";

export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      convertSize: 1000000,
      success(result) {
        resolve(result);
      },
      error(err) {
        reject(err);
      },
    });
  });
};
