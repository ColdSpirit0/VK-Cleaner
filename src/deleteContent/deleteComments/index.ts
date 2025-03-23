import config from "@/config"
import { driver } from "@/driver"
import { CommentsParser } from "@/parsers/CommentsParser/CommentsParser"
import { abortSignal, Progress, TaskCancelledError } from "@/classes/Progress"
import { Reporter } from "@/classes/Reporter"
import { Task } from "@/classes/Task"
import { logger } from "@/utils/Logger"
import { clickElement, findElements, waitActionComplete } from "@/utils/selenium"
import { getUserId, openPage } from "../vkHelpers"


const reporter = new Reporter(Task.DeleteComments)


export async function deleteComments(progress: Progress) {
    if (!progress.initialized) {
        try {
            const parser = new CommentsParser()
            parser.init(config.archivePath)
            progress.data = await parser.parse()
        }
        catch (e) {
            logger.error("Cannot parse comments:\n", e)
            logger.log("Skipping task DeleteComments")
            return
        }

        progress.initialized = true
    }

    let userId = null

    for (; progress.index < progress.data.length; progress.index++) {
        if (abortSignal.aborted) throw new TaskCancelledError()

        const url: string = progress.data[progress.index]

        const pageOk = await openPage(url, reporter)
        if (pageOk) {
            if (userId === null) {
                userId = await getUserId()
                logger.log("userId:", userId)
            }

            let deletedComments = await deleteCommentsInPage(userId)
            await reporter.report(url, deletedComments || "Комментарии не найдены")
        }
    }
}

async function deleteCommentsInPage(userId: number) {
    await driver.sleep(1000)
    const deleteButtonSelector = `//*[class("replies_list")]//*[class("reply") and descendant::*[class("author") and @data-from-id="${userId}"]]//*[class("reply_delete_button")]`
    let buttons = await findElements(deleteButtonSelector, { now: true })

    for (const button of buttons) {
        await clickElement(button, { now: true })
        await waitActionComplete()
    }

    return buttons.length
}
