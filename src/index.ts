import fs from "fs"
import { InvalidOptionArgumentError, program } from "commander"
import config from "@/config"
import { initDriver } from "@/driver"
import { loginVK } from "@/loginVK"
import { abortController, Progress, TaskCancelledError,  } from "@/classes/Progress"
import { Task } from "@/classes/Task"
import { logger } from "@/utils/Logger"
import { deleteLikes } from "@/deleteContent/deleteLikes"
import { deleteComments } from "@/deleteContent/deleteComments"
import { deletePhotoTags } from "@/deleteContent/deletePhotoTags"
import { exitGroups } from "@/deleteContent/exitGroups"
import { deleteVideos } from "@/deleteContent/deleteVideos"
import { deleteMusic } from "@/deleteContent/deleteMusic"
import { deleteWall } from "@/deleteContent/deleteWall"


type TaskMap = Map<Task, Function>


main().catch(console.log)


async function main() {
    const tasks: TaskMap = new Map()
    tasks.set(Task.DeleteWall, deleteWall)
    tasks.set(Task.DeleteLikes, deleteLikes)
    tasks.set(Task.DeleteComments, deleteComments)
    tasks.set(Task.DeleteVideos, deleteVideos)
    tasks.set(Task.DeleteMusic, deleteMusic)
    tasks.set(Task.DeletePhotoTags, deletePhotoTags)
    tasks.set(Task.ExitGroups, exitGroups)

    // parse and process args
    const args = parseArguments(tasks)

    if (args.verbose) config.verbose = true

    if (args.manual) {
        config.dontCloseBrowser = true
        await initDriver()
        return
    }

    // init
    const progress = new Progress()
    await fs.promises.mkdir(config.reportsDirectoryPath, { recursive: true })

    const taskOrder: Task[] = await (async () => {
        // if user defined tasks, use them
        // and ignore the progress
        if (args.tasks) {
            config.saveProgress = false
            return args.tasks
        }

        // start tasks from progress-saved
        await progress.load()
        const taskOrder = [...tasks.keys()]
        const defaultTaskIndex = taskOrder.indexOf(progress.task)

        // if task not found in the taskOrder then begin from zero
        if (defaultTaskIndex === -1) {
            progress.reset()
            return [...tasks.keys()]
        }

        return taskOrder.slice(defaultTaskIndex)
    })()

    logger.debug("Tasks to run:", taskOrder.map(t => Task[t]))
    logger.debug(progress.toString())

    await initDriver()

    try {
        // work with vk
        await loginVK()
        for (const task of taskOrder) {
            const taskfun = tasks.get(task)

            progress.task = task
            progress.initialized = false
            await taskfun(progress)
        }

        progress.finish()

    } catch (error) {
        if (error instanceof TaskCancelledError) {
            logger.log("Aborted")
        }
        else {
            logger.error("got error in main:\n", error)
            logger.error(progress.toString())
        }
    }
    finally {
        if (config.saveProgress) {
            await progress.save()
        }
    }
}


function parseArguments(tasks: TaskMap): { verbose?: boolean, manual?: boolean, tasks?: Task[] } {
    const possibleTaskValues = "Possible values: "
        + [...tasks.keys()].map(k => Task[k]).join(", ")

    program
        .name("npm run start --")
        .option("-v --verbose", "Enable verbose mode")
        .option("-m --manual", "Run in manual mode")
        .option("-t --tasks <tasks...>", `Specify which tasks to run, separated by spaces.\n${possibleTaskValues}`,
            (value: string, previous: undefined | [Task]) => {
                const task = Task[value]
                if (task === undefined || !tasks.has(task)) {
                    throw new InvalidOptionArgumentError(`${value} is not valid task name.\n${possibleTaskValues}`)
                }
                if (previous === undefined) return [task]
                return [...previous, task]
            }
        )

    program.parse()
    return program.opts()
}

process.on('SIGINT', function() {
    console.log("Caught interrupt signal, aborting...");
    abortController.abort()
});
