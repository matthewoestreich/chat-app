// @ts-nocheck
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
  const DEFAULT_DESCRIPTION = `Uploaded via script @ ${new Date().toUTCString()} UTC`;

  return new Promise(async (resolve, reject) => {
    try {
      const files = {};
      for (const filePath of filePaths) {
        if (!isFile(filePath)) {
          return reject(`[createGist] filePath:'${filePath}' not a file`);
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

      const { status, ok, statusText } = response;
      if (!ok || (status < 200 && status > 300 && status !== 304)) {
        return reject(`[createGist] something went wrong during updating : ${statusText} | ${status}`);
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
export async function updateGist(filePaths: string[], gistId: string, apiKey: string, description?: string): Promise<Gist> {
  return new Promise(async (resolve, reject) => {
    const URL = `https://api.github.com/gists/${gistId}`;
    const DEFAULT_DESCRIPTION = `Updated via script @ ${new Date().toUTCString()} UTC`;

    try {
      const files = {};
      for (const filePath of filePaths) {
        if (!isFile(filePath)) {
          return reject(`[updateGist] filePath:'${filePath}' not a file`);
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

      const { status, ok, statusText } = response;
      if (!ok || (status < 200 && status > 300 && status !== 304)) {
        return reject(`[updateGist] something went wrong during updating : ${statusText} | ${status}`);
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
export async function getGistFiles(gistId: string, apiKey: string): Promise<GistFile[]> {
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

      const { status, ok, statusText } = response;
      if (!ok || (status < 200 && status > 300 && status !== 304)) {
        return reject(`[getGistFiles] something went wrong getting gist files : ${statusText} | ${status}`);
      }

      const result: Gist = await response.json();

      const fileContents: GistFile[] = [];
      const files: GistFile[] = Object.values(result.files);

      // We have to check if any files are truncated.
      // GitHub only allows 1mb file size by default. If a file is truncated
      // we have to get the raw file. This only works for anything under 10mb.
      // If a file is > 10mb you have to use git to pull down the file...
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.truncated) {
          file.content = await getRawGist(file.raw_url, apiKey);
        }
        fileContents.push(file);
      }

      resolve(fileContents);
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

      const { status, ok, statusText } = response;
      if (!ok || (status < 200 && status > 300 && status !== 304)) {
        return reject(`[getRawGist] something went wrong getting raw gist : ${statusText} | ${status}`);
      }

      const result = await response.text();
      resolve(result);
    } catch (e) {
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
