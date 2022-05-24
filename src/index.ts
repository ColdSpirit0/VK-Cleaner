import config from "./config"
import { initDriver, driver } from "./driverInstance"
import { deleteLikes } from "./deleteLikes"
import { loginVK } from "./loginVK"
import { getProgress, Progress, saveProgress } from "./progress"
import { Task } from "./Task"
import fs from "fs"

main().catch(console.log)

async function main() {
    // init
    console.clear()
    await initDriver()
    let progress: Progress = await getProgress()
    await fs.promises.mkdir(config.reportsDirectoryPath, {recursive: true})
    
    // work with vk
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

    // end
    await saveProgress(progress)

    if (config.dontCloseBrowser) {
        // TODO: end nodejs when window closed
        await driver.sleep(100000000)
    }
}

