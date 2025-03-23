import lodash from "lodash";
import { abortSignal, Progress, TaskCancelledError } from "@/classes/Progress";
import { Reporter } from "@/classes/Reporter";
import { Task } from "@/classes/Task";
import { clickElement, findElement, scrollToBottom, waitActionComplete } from "@/utils/selenium";
import { getProfileUrl, openPage } from "../vkHelpers";
import { driver } from "@/driver";

const reporter = new Reporter(Task.DeleteVideos)

const o = {
    locators: {
        loadMore: `//*[contains(concat(" ", @class), " DynamicPagination__root--")]`,
        videoDeleteButton: `.VideoCard:not(.VideoCard--deleted) .VideoCard__action--delete`,
    }
}

export async function deleteVideos(progress: Progress) {
    // get user nickname
    let profileUrl = await getProfileUrl()
    let userNickname = lodash.last(profileUrl.split("/"))

    // open videos page
    await openPage(`https://vk.com/video/@${userNickname}`)

    // load all videos
    while (await findElement(o.locators.loadMore) !== null) {
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
    let button = await clickElement(o.locators.videoDeleteButton)
    if (button === null) {
        return false
    }
    await waitActionComplete()

    return true
}