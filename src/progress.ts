import { Task } from "./Task";
import config from "./config";
import fs from "fs";
import { isExists } from "./utils/fs";
import path from "path";
import { logger } from "./utils/Logger";

export class Progress {
    task: null | Task = null
    data: null | any[] = null
    index: number = 0

    async load() {
        if (await isExists(config.progressFilePath)) {
            const data = await fs.promises.readFile(config.progressFilePath, { encoding: "utf-8" });
            const parsedData = JSON.parse(data) as Progress

            this.task = parsedData.task
            this.data = parsedData.data
            this.index = parsedData.index || 0

            // to be sure the task is completed
            if (this.index > 0) this.index--
        }
        else {
            this.reset()
        }
    }

    async save() {
        logger.log("saving progress", path.resolve(config.progressFilePath))
        await fs.promises.writeFile(config.progressFilePath, JSON.stringify(this), { encoding: "utf-8" })
    }

    reset() {
        this.task = null
        this.data = null
        this.index = 0
    }

    finish() {
        this.task = Task.Finished
        this.data = null
        this.index = 0
    }
}