import config from "./config"
import { WebDriver } from "selenium-webdriver"
import { initDriver } from "./driverInstance"
import { deleteLikes } from "./deleteLikes"
import { loginVK } from "./loginVK"
import { getProgress, Progress, saveProgress } from "./progress"
import { Tasks } from "./Tasks"

main().catch(console.log)

export let driver: WebDriver

async function main() {
    console.clear()
    driver = await initDriver()
    let progress: Progress = await getProgress()

    try {
        await loginVK()
        switch (progress.task) {
            default:
            case Tasks.DeleteLikes:
                await deleteLikes(progress)
            // case Tasks.DeleteComments:
                // nope
        }

        progress.task = Tasks.Finished
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

