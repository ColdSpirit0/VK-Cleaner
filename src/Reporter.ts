import fs from "fs"
import path from "path";
import config from "./config";
import { Task } from "./Task";

export class Reporter {
    filePath: string;

    constructor(name: Task | string) {
        if (typeof name !== "string") {
            name = Task[name].toString() 
        }
        this.filePath = path.join(config.reportsDirectoryPath,  name + ".log")
    }

    async report(...args: any[]) {
        await fs.promises.appendFile(this.filePath, args.join(" ") + "\n", {encoding: "utf-8"})
    }
}