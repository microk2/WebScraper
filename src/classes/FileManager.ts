import path from "path";
import fs from "fs";

export default class FileManager {
  public static get projectDirPath(): string {
    const dirPath: string = path.parse(__dirname).dir.replace(/build|src/g, "");
    return dirPath.substring(0, dirPath.length - 1);
  }

  public static get buildDirPath(): string {
    return `${FileManager.projectDirPath}/build`;
  }

  public static get sqlDirPath(): string {
    return `${FileManager.projectDirPath}/sql`;
  }

  public static get isEnvFileCreated(): boolean {
    return this.isValidPath("/.env");
  }

  public static isValidPath(filePath: string): boolean {
    return fs.existsSync(path.join(this.projectDirPath, `${filePath}`));
  }
}
