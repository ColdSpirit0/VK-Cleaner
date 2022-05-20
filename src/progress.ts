import { Tasks } from "./Tasks";
import config from "./config";
import fs from "fs";
import { isExists } from "./utils/fs";
import path from "path";


// TODO: Make a class

export interface Progress {
    task: Tasks;
    data: null | any[];
    index: number;
}

export async function getProgress() {
    if (await isExists(config.progressFilePath)) {
        let data = await fs.promises.readFile(config.progressFilePath, { encoding: "utf-8" });
        return JSON.parse(data) as Progress;
    }
    else {
        return {
            task: null,
            data: null,
            index: 0,
        };
    }
}

export async function saveProgress(progress: Progress) {
    console.log("saving progress", path.resolve(config.progressFilePath))
    await fs.promises.writeFile(config.progressFilePath, JSON.stringify(progress), { encoding: "utf-8" })
}