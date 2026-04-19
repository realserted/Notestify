export interface ExtractResult {
  text: string;
  filename: string;
}

export const extractFileWithProgress = (
  file: File,
  onUploadProgress: (percent: number) => void
): Promise<ExtractResult> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onUploadProgress((e.loaded / e.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid server response'));
        }
        return;
      }
      try {
        const { error } = JSON.parse(xhr.responseText);
        reject(new Error(error || `HTTP ${xhr.status}`));
      } catch {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.open('POST', '/api/extract');
    xhr.send(form);
  });
