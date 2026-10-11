import config from "@/config"
import { driver } from "@/driver"
import { CommentsParser } from "@/parsers/CommentsParser/CommentsParser"
import { abortSignal, Progress, TaskCancelledError } from "@/classes/Progress"
import { Reporter } from "@/classes/Reporter"
import { Task } from "@/classes/Task"
import { logger } from "@/utils/Logger"
import { clickElement, findElements, hoverElement, waitActionComplete } from "@/utils/selenium"
import { getUserId, openPage } from "../vkHelpers"
import { clickTextAction, findChildElement } from "../vkDom"
import { WebElement } from "selenium-webdriver"


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
                if (userId === null) {
                    await reporter.report(url, "Не удалось определить userId")
                    continue
                }
            }

            let deletedComments = await deleteCommentsInPage(userId)
            await reporter.report(url, deletedComments || "Комментарии не найдены")
        }
    }
}

async function deleteCommentsInPage(userId: number) {
    await driver.sleep(1000)
    const deleteButtonSelector = `//*[class("replies_list")]//*[class("reply") and descendant::*[class("author") and @data-from-id="${userId}"]]//*[class("reply_delete_button")] |
        //*[(class("reply") or @data-testid="comment" or contains(@class, "Comment")) and descendant::*[
            @data-from-id="${userId}"
            or contains(@href, "id${userId}")
        ]]//*[@data-testid="delete" or contains(@data-testid, "delete") or contains(@aria-label, "Удалить") or contains(@title, "Удалить")]`
    let buttons = await findElements(deleteButtonSelector, { now: true })

    for (const button of buttons) {
        await clickElement(button, { now: true })
        await waitActionComplete()
    }

    if (buttons.length > 0) {
        return buttons.length
    }

    const ownCommentSelector = `//*[class("reply") and descendant::*[class("author") and @data-from-id="${userId}"]] |
        //*[@data-testid="comment" and descendant::*[@data-from-id="${userId}" or contains(@href, "id${userId}")]] |
        //*[contains(@class, "Comment") and descendant::*[@data-from-id="${userId}" or contains(@href, "id${userId}")]]`
    const comments = await findElements(ownCommentSelector, { now: true })
    let deletedComments = 0

    for (const comment of comments) {
        if (await deleteCommentThroughMenu(comment)) {
            deletedComments++
        }
    }

    return deletedComments
}

async function deleteCommentThroughMenu(comment: WebElement) {
    await hoverElement(comment, { now: true })

    const directDeleteButton = await findChildElement(comment, [
        ".reply_delete_button",
        "[data-testid*='delete']",
        "[aria-label*='Удалить']",
        "[title*='Удалить']",
    ])
    if (directDeleteButton !== null) {
        await clickElement(directDeleteButton, { now: true })
        await waitActionComplete()
        return true
    }

    const menuButton = await findChildElement(comment, [
        "[data-testid*='comment'][data-testid*='menu']",
        "[data-testid*='actions']",
        "[aria-label*='Действия']",
        "[aria-label*='Ещё']",
        "[title*='Действия']",
        "[title*='Ещё']",
        ".reply_more_action",
        ".ui_actions_menu_icons",
    ])
    if (menuButton === null) {
        return false
    }

    await clickElement(menuButton, { now: true })
    const deleteAction = await clickTextAction(["Удалить"], { waitTime: 1000 })
    if (deleteAction === null) {
        return false
    }

    await waitActionComplete()
    return true
}
