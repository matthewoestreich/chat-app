import nodePath from "node:path";
import nodeFs from "node:fs";
import dotenv from "dotenv";
dotenv.config();

/**
 * Creates a new gist.
 * @param filePath
 * @param isPublic
 * @param apiKey
 * @param description?
 * @returns
 */
export async function createNewGist(filePaths: string[], isPublic: boolean, apiKey: string, description?: string): Promise<Gist> {
  const URL = "https://api.github.com/gists";
  const DEFAULT_DESCRIPTION = `Uploaded via script @ ${new Date().toLocaleString()}`;

  return new Promise(async (resolve, reject) => {
    try {
      const files = {};
      for (const filePath of filePaths) {
        if (!isFile(filePath)) {
          const errMsg = `[uploadFileToGist][createPrivateGist] filePath:'${filePath}' not a file`;
          console.error(errMsg);
          return reject(errMsg);
        }
        const fileName = nodePath.basename(filePath);
        files[fileName] = { content: nodeFs.readFileSync(filePath, "utf-8") };
      }

      const gistData = {
        description: description === undefined ? DEFAULT_DESCRIPTION : description,
        public: isPublic,
        files,
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

      const result = await response.json();

      const { status, ok } = response;
      if (!ok || (status < 200 && status > 300 && status !== 304)) {
        const errMsg = `[updateGist] something went wrong during updating`;
        console.error(errMsg);
        reject(errMsg);
        return;
      }
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
export async function updateGist(filePaths: string[], gistId: string, apiKey: string, description?: string): Promise<Gist> {
  return new Promise(async (resolve, reject) => {
    const URL = `https://api.github.com/gists/${gistId}`;
    const DEFAULT_DESCRIPTION = `Updated via script @ ${new Date().toLocaleString()}`;

    try {
      const files = {};
      for (const filePath of filePaths) {
        if (!isFile(filePath)) {
          console.error(`[updateGist] filePath:'${filePath}' not a file`);
          reject("filePath not a file");
          return;
        }
        const fileName = nodePath.basename(filePath);
        files[fileName] = { content: nodeFs.readFileSync(filePath, "utf-8") };
      }

      const gistData = {
        gist_id: gistId,
        description: description === undefined ? DEFAULT_DESCRIPTION : description,
        files,
      };

      const response = await fetch(URL, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gistData),
      });

      const result = await response.json();

      const { status, ok } = response;
      if (!ok || (status < 200 && status > 300 && status !== 304)) {
        const errMsg = `[updateGist] something went wrong during updating`;
        console.error(errMsg, result, response);
        reject(errMsg);
        return;
      }

      resolve(result);
    } catch (e) {
      console.error(`[updateGist] error updating gist`, e);
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
export async function getGistFiles(gistId: string, apiKey: string): Promise<GistFile[]> {
  return new Promise(async (resolve, reject) => {
    const URL = `https://api.github.com/gists/${gistId}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.github+json",
    };

    try {
      const response = await fetch(URL, {
        method: "GET",
        headers,
      });

      const result: Gist = await response.json();

      const { status, ok } = response;
      if (!ok || (status < 200 && status > 300 && status !== 304)) {
        const errMsg = `[getGistFiles] something went wrong getting gist`;
        console.error(errMsg, result, response);
        reject(errMsg);
        return;
      }

      const fileContents: GistFile[] = [];
      const files: GistFile[] = Object.values(result.files);

      // We have to check if any files are truncated.
      // GitHub only allows 1mb file size by default. If a file is truncated
      // we have to get the raw file. this only works for anything under 10mb.
      // If a file is > 10mb you have to use git to pull down the file...
      if (files && files.length) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.truncated) {
            file.content = await getRawGist(file.raw_url, apiKey);
          }
          fileContents.push(file);
        }
      }

      resolve(fileContents);
    } catch (e) {
      console.error(`[getGistFiles] error getting gist`, e);
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
      const headers = {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.github+json",
      };
      const response = await fetch(url, { method: "GET", headers });
      const result = await response.text();

      const { status, ok } = response;
      if (!ok || (status < 200 && status > 300 && status !== 304)) {
        const errMsg = `[getRawGist] something went wrong getting raw gist`;
        console.error(errMsg, result, response);
        return reject(errMsg);
      }

      resolve(result);
    } catch (e) {
      console.log(`[getRawGist][ERROR]`, e);
      reject(e);
    }
  });
}

/**
 * Determines if path is to a file.
 * @param path
 * @returns
 */
function isFile(path) {
  try {
    const stats = nodeFs.statSync(path);
    return stats.isFile();
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("Path does not exist.");
      return false;
    }
    console.error("Error:", err);
    return false;
  }
}
