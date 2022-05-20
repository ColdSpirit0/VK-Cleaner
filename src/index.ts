import config from "./config"
import { WebDriver } from "selenium-webdriver"
import { initDriver } from "./driverInstance"
import { deleteLikes } from "./deleteLikes"
import { loginVK } from "./loginVK"
import { getProgress, Progress, saveProgress } from "./progress"
import { Task } from "./Task"
import fs from "fs"

main().catch(console.log)

export let driver: WebDriver

async function main() {
    console.clear()
    driver = await initDriver()
    let progress: Progress = await getProgress()
    await fs.promises.mkdir(config.reportsDirectoryPath, {recursive: true})

    try {
        await loginVK()
        switch (progress.task) {
            default:
            case Task.DeleteLikes:
                await deleteLikes(progress)
            // case Task.DeleteComments:
                // nope
        }

        progress.task = Task.Finished
        progress.data = null
        progress.index = 0

    } catch (error) {
        console.log("got error in main:", error)
    }

    await saveProgress(progress)

    if (config.dontCloseBrowser) {
        await driver.sleep(100000000)
    }
}

