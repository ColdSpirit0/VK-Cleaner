import config from "./config"
import { initDriver, driver } from "./driverInstance"
import { deleteLikes } from "./deleteContent/deleteLikes"
import { loginVK } from "./loginVK"
import { getProgress, Progress, saveProgress } from "./progress"
import { Task } from "./Task"
import fs from "fs"
import { logger } from "./utils/Logger"
import { waitBrowserClosed } from "./utils/selenium"
import { deleteComments } from "./deleteContent/deleteComments"
import { deletePhotoTags } from "./deleteContent/deletePhotoTags"
import { exitGroups } from "./deleteContent/exitGroups"
import { deleteVideos } from "./deleteContent/deleteVideos"
import { deleteMusic } from "./deleteContent/deleteMusic"
import { deleteWall } from "./deleteContent/deleteWall"

main().catch(console.log)

async function main() {
    console.clear()

    const args = process.argv.slice(2)
    console.log("Args:", args)

    // run with `npm run start -- debug`
    if (args.includes("debug")) {
        config.debug = true
    }

    if (args.includes("manual")) {
        config.dontCloseBrowser = true
        await initDriver()
        return
    }

    // init
    await initDriver()
    let progress: Progress = await getProgress()
    await fs.promises.mkdir(config.reportsDirectoryPath, {recursive: true})
    
    // work with vk
    try {
        await loginVK()
        switch (progress.task) {
            default:
            case Task.DeleteWall:
                await deleteWall(progress)
            case Task.DeleteLikes:
                await deleteLikes(progress)
            case Task.DeleteComments:
                await deleteComments(progress)
            case Task.DeleteVideos:
                await deleteVideos(progress)
            case Task.DeleteMusic:
                await deleteMusic(progress)
            case Task.DeletePhotoTags:
                await deletePhotoTags(progress)
            case Task.ExitGroups:
                await exitGroups(progress)
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
}

