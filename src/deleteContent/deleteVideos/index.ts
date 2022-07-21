import lodash from "lodash";
import { driver } from "../../driverInstance";
import { Progress } from "../../progress";
import { Reporter } from "../../Reporter";
import { Task } from "../../Task";
import { clickElement, findElement, scrollToBottom, waitActionComplete } from "../../utils/selenium";
import { getProfileUrl } from "../vkHelpers";

const reporter = new Reporter(Task.DeleteVideos)

export async function deleteVideos(progress: Progress) {
    if (progress.task !== Task.DeleteVideos) {
        progress.task = Task.DeleteVideos
    }

    // get user nickname
    let profileUrl = await getProfileUrl()
    let userNickname = lodash.last(profileUrl.split("/"))

    // open videos page
    await driver.get(`https://vk.com/video/@${userNickname}`)

    // load all videos
    let loadMoreElement = await findElement("#ui_all_load_more")
    while(loadMoreElement !== null && await loadMoreElement.isDisplayed()) {
        await scrollToBottom()
    }

    // delete each video
    let deletedVideosCount = 0
    while(await deleteVideo()) {
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