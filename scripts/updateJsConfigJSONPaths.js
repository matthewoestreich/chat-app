// Updates paths in jsconfig.json file using "imports" field within package.json.
import path from "path";
import fs from "fs";

try {
  const jsconfigjsonPath = path.resolve(import.meta.dirname, "../jsconfig.json");
  const packagejsonPath = path.resolve(import.meta.dirname, "../package.json");

  const packagejsonRaw = await fs.readFileSync(packagejsonPath, 'utf-8');
  const jsconfigjsonRaw = await fs.readFileSync(jsconfigjsonPath, 'utf-8');
  const packagejson = JSON.parse(packagejsonRaw);
  const jsconfigjson = JSON.parse(jsconfigjsonRaw);

  if (!packagejson || !packagejson.imports) {
    console.error("Missing package.json->imports!");
    process.exit(1);
  }

  const updatedPaths = {};
  for (const [key, val] of Object.entries(packagejson.imports)) {
    updatedPaths[key] = [val];
  }

  jsconfigjson.compilerOptions.paths = updatedPaths;

  if (!jsconfigjson || !jsconfigjson.compilerOptions) {
    console.error("Error adding package.json->imports to jsconfig.json->compilerOptions->path");
    process.exit(1);
  }

  await fs.writeFileSync(jsconfigjsonPath, JSON.stringify(jsconfigjson, null, 2));

  console.log("Success!");
  process.exit(0);
} catch (e) {
  console.error("Something went wrong updating jsconfig.json from package.json!", e);
  process.exit(1);
}
