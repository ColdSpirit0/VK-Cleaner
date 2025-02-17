import config from "../../config"
import { driver } from "../../driverInstance"
import { CommentsParser } from "../../parsers/CommentsParser/CommentsParser"
import { Progress } from "../../progress"
import { Reporter } from "../../Reporter"
import { Task } from "../../Task"
import { logger } from "../../utils/Logger"
import { clickElement, findElements, waitActionComplete } from "../../utils/selenium"
import { getUserId, openPage } from "../vkHelpers"


const reporter = new Reporter(Task.DeleteComments)

export async function deleteComments(progress: Progress) {
    if (progress.task !== Task.DeleteComments) {
        progress.task = Task.DeleteComments

        let parser = new CommentsParser()
        parser.init(config.archivePath)

        let urls = await parser.parse()

        progress.data = urls
    }

    let userId = null

    for (; progress.index < progress.data.length; progress.index++) {
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
    let buttons = await findElements(deleteButtonSelector, {now: true})

    for (const button of buttons) {
        await clickElement(button, {now: true})
        await waitActionComplete()
    }

    return buttons.length
}
