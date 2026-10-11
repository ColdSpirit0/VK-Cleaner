import lodash from "lodash";
import { abortSignal, Progress, TaskCancelledError } from "@/classes/Progress";
import { Reporter } from "@/classes/Reporter";
import { Task } from "@/classes/Task";
import { findElement, hoverElement, scrollToBottom, waitActionComplete } from "@/utils/selenium";
import { getProfileUrl, openPage } from "../vkHelpers";
import { driver } from "@/driver";
import { clickFirstElement, clickTextAction } from "../vkDom";

const reporter = new Reporter(Task.DeleteVideos)

const o = {
    locators: {
        loadMore: `//*[contains(concat(" ", @class), " DynamicPagination__root--") or contains(@class, "vkuiSpinner") or @role="progressbar"]`,
        videoCard: `.VideoCard:not(.VideoCard--deleted), [data-testid*="video_card"], [class*="VideoCard"]:not([class*="deleted"])`,
        videoActions: [
            `.VideoCard:not(.VideoCard--deleted) [class*="action"]`,
            `[data-testid*="video_card"] [data-testid*="actions"]`,
            `[data-testid*="video"] [aria-label*="Действия"]`,
            `[data-testid*="video"] [aria-label*="Ещё"]`,
        ],
        videoDeleteButton: [
            `.VideoCard:not(.VideoCard--deleted) .VideoCard__action--delete`,
            `[data-testid*="video"][data-testid*="delete"]`,
            `[role="menuitem"][aria-label*="Удалить"]`,
        ],
    }
}

export async function deleteVideos(progress: Progress) {
    // get user nickname
    let profileUrl = await getProfileUrl()
    let userNickname = lodash.last(profileUrl.split("/"))

    // open videos page
    await openPage(`https://vk.com/video/@${userNickname}`)

    // load all videos
    while (true) {
        const loadMore = await findElement(o.locators.loadMore, { waitTime: 1000 })
        if (loadMore === null || !await loadMore.isDisplayed()) {
            break
        }

        if (abortSignal.aborted) throw new TaskCancelledError()
        await scrollToBottom()
        await driver.sleep(200)
    }

    // delete each video
    let deletedVideosCount = 0
    while (await deleteVideo()) {
        if (abortSignal.aborted) throw new TaskCancelledError()
        deletedVideosCount++
    }
    await reporter.report("Удалено видео:", deletedVideosCount)
}

async function deleteVideo() {
    const card = await hoverElement(o.locators.videoCard, { waitTime: 1000 })
    if (card === null) {
        return false
    }

    let button = await clickFirstElement(o.locators.videoDeleteButton, { waitTime: 500 })
    if (button === null) {
        await clickFirstElement(o.locators.videoActions, { waitTime: 500 })
        button = await clickFirstElement(o.locators.videoDeleteButton, { waitTime: 500 })
        if (button === null) {
            button = await clickTextAction(["Удалить видео", "Удалить"], { waitTime: 500 })
        }
    }
    if (button === null) return false

    await waitActionComplete()

    const confirmButton = await clickFirstElement([
        `//*[@id="box_layer"]//*[class("FlatButton") and descendant-or-self::*[contains(normalize-space(.), "Удалить")]]`,
        `[data-testid="modal-confirm-button"]`,
        `[data-testid*="confirm"]`,
    ], { waitTime: 500 })
    if (confirmButton !== null) {
        await waitActionComplete()
    }

    return true
}
