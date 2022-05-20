import fs from "fs"
import path from "path";
import config from "./config";
import { Task } from "./Task";

export class Reporter {
    filePath: string;

    constructor(task: Task) {
        this.filePath = path.join(config.reportsDirectoryPath, task.toString() + ".json")
    }

    async report(...args: any[]) {
        await fs.promises.appendFile(this.filePath, args.join(" "), {encoding: "utf-8"})
    }
}