import "./types";
import nodePath from "node:path";
import nodeFs from "node:fs";

/**
 * Creates a new gist.
 * @param filePath
 * @param isPublic
 * @param apiKey
 * @param description?
 * @returns
 */
export async function createNewGist(apiKey: string, filePaths: string[], isPublic: boolean, description?: string): Promise<Gist> {
  const URL = "https://api.github.com/gists";
  const DEFAULT_DESCRIPTION = `Uploaded via script @ ${new Date().toUTCString()} UTC`;

  return new Promise(async (resolve, reject) => {
    try {
      const gistData = {
        description: description === undefined ? DEFAULT_DESCRIPTION : description,
        public: isPublic,
        files: createFilesObject(filePaths),
      };

      const response = await fetch(URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify(gistData),
      });

      if (!isResponseOk(response)) {
        return reject(`[createGist] something went wrong during updating : ${response.statusText} | ${response.status}`);
      }

      const result = await response.json();
      resolve(result);
    } catch (e) {
      console.error(`[createGist] Something went wrong creating gist`, e);
      reject(e);
    }
  });
}

/**
 * Updates a gist
 * @param content : contents to update
 * @param gistId : id of gist
 * @param apiKey : github api key
 * @param description? : description
 * @returns
 */
export async function updateGist(apiKey: string, gistId: string, filePaths: string[], description?: string): Promise<Gist> {
  return new Promise(async (resolve, reject) => {
    const URL = `https://api.github.com/gists/${gistId}`;
    const DEFAULT_DESCRIPTION = `Updated via script @ ${new Date().toUTCString()} UTC`;

    try {
      const gistData = {
        gist_id: gistId,
        description: description === undefined ? DEFAULT_DESCRIPTION : description,
        files: createFilesObject(filePaths),
      };

      const response = await fetch(URL, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gistData),
      });

      if (!isResponseOk(response)) {
        return reject(`[updateGist] something went wrong updating gist : ${response.statusText} | ${response.status}`);
      }

      const result = await response.json();
      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Gets files that belong to a gist.
 * @param gistId
 * @param apiKey
 * @returns
 */
export async function getGistFiles(apiKey: string, gistId: string): Promise<GistFile[]> {
  return new Promise(async (resolve, reject) => {
    const URL = `https://api.github.com/gists/${gistId}`;

    try {
      const response = await fetch(URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (!isResponseOk(response)) {
        return reject(`[getGistFiles] something went wrong getting gist files : ${response.statusText} | ${response.status}`);
      }

      const result: Gist = await response.json();
      const files: GistFile[] = Object.values(result.files);

      // We have to check if any files are truncated. GitHub only allows 1mb file size by default. If a file is truncated
      // we have to get the raw file. This only works for anything under 10mb. If a file is > 10mb you have to use git to
      // pull down the file...
      for (let file of files) {
        if (file.truncated) {
          file.content = await getRawGist(file.raw_url, apiKey);
        }
      }

      resolve(files);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Get a raw gist file.
 * Due to the 1mb size limit on Gist files, we have to get the raw file.
 * @param url
 * @param apiKey
 * @returns
 */
async function getRawGist(url: string, apiKey: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (!isResponseOk(response)) {
        return reject(`[getRawGist] something went wrong getting raw gist : ${response.statusText} | ${response.status}`);
      }

      const result = await response.text();
      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Validates GitHub Gists API response.
 * @param response
 */
function isResponseOk(response: Response): boolean {
  const { status, ok } = response;
  if (!ok || (status < 200 && status > 300 && status !== 304)) {
    return false;
  }
  return true;
}

/**
 * Returns a files object in "Gist acceptable format" for GitHub API.
 * Files object shape = key is file name, 'content' field is contents of file.
 * @param filePaths
 */
function createFilesObject(filePaths: string[]): FilesObject {
  const files: FilesObject = {};

  for (const filePath of filePaths) {
    if (!isFile(filePath)) {
      throw new Error(`[createFilesObject] filePath:'${filePath}' not a file`);
    }

    const fileName = nodePath.basename(filePath);
    const content = nodeFs.readFileSync(filePath, "utf-8");

    files[fileName] = { content };
  }

  return files;
}

/**
 * Determines if path is to a file.
 * @param path
 */
function isFile(path: string): boolean {
  try {
    const stats = nodeFs.statSync(path);
    return stats.isFile();
  } catch (err) {
    console.error("[isFile][ERROR]", err);
    return false;
  }
}
