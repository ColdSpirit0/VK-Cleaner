import config from "./config"
import { initDriver, driver } from "./driverInstance"
import { deleteLikes } from "./deleteLikes"
import { loginVK } from "./loginVK"
import { getProgress, Progress, saveProgress } from "./progress"
import { Task } from "./Task"
import fs from "fs"
import { logger } from "./utils/logger"

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
        logger.error("got error in main:\n", error)
        logger.error("data item:", progress.data[progress.index])
    }

    if (config.saveProgress) {
        await saveProgress(progress)
    }

    // wait for browser closed manually
    while (config.dontCloseBrowser) {
        await driver.sleep(1000)
        let handles = await driver.getAllWindowHandles()
        if (handles.length === 0) {
            await driver.quit()
            break
        }
    }
}

