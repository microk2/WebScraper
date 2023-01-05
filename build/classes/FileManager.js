"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class FileManager {
    static get projectDirPath() {
        const dirPath = path_1.default.parse(__dirname).dir.replace(/build|src/g, "");
        return dirPath.substring(0, dirPath.length - 1);
    }
    static get buildDirPath() {
        return `${FileManager.projectDirPath}/build`;
    }
    static get isEnvFileCreated() {
        return this.isValidPath("/.env");
    }
    static isValidPath(filePath) {
        return fs_1.default.existsSync(path_1.default.join(this.projectDirPath, `${filePath}`));
    }
}
exports.default = FileManager;
