import lodash from "lodash";
import { abortSignal, Progress, TaskCancelledError } from "../../progress";
import { Reporter } from "../../Reporter";
import { Task } from "../../Task";
import { clickElement, findElement, scrollToBottom, waitActionComplete } from "../../utils/selenium";
import { getProfileUrl, openPage } from "../vkHelpers";

const reporter = new Reporter(Task.DeleteVideos)

export async function deleteVideos(progress: Progress) {
    // get user nickname
    let profileUrl = await getProfileUrl()
    let userNickname = lodash.last(profileUrl.split("/"))

    // open videos page
    await openPage(`https://vk.com/video/@${userNickname}`)

    // load all videos
    let loadMoreElement = await findElement("#ui_all_load_more")
    while(loadMoreElement !== null && await loadMoreElement.isDisplayed()) {
        if (abortSignal.aborted) throw new TaskCancelledError()
        await scrollToBottom()
    }

    // delete each video
    let deletedVideosCount = 0
    while(await deleteVideo()) {
        if (abortSignal.aborted) throw new TaskCancelledError()
        deletedVideosCount++
    }
    await reporter.report("Удалено видео:", deletedVideosCount)
}

async function deleteVideo() {
    // let card = await hoverElement(".VideoCard:not(.VideoCard--deleted)")
    // if (card === null) {
    //     return false
    // }

    // await clickElement(".VideoCard:not(.VideoCard--deleted) .VideoCard__action--delete", {safe: false})
    let button = await clickElement(".VideoCard:not(.VideoCard--deleted) .VideoCard__action--delete")
    if (button === null) {
        return false
    }
    await waitActionComplete()
    // await waitBrowserClosed()

    return true
}