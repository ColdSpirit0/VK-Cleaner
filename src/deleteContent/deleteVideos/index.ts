import lodash from "lodash";
import { driver } from "../../driverInstance";
import { Progress } from "../../progress";
import { Task } from "../../Task";
import { clickElement, findElement, findElements, hoverElement, scrollToBottom, waitActionComplete, waitBrowserClosed } from "../../utils/selenium";
import { getProfileUrl } from "../vkHelpers";

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
    while(await loadMoreElement.isDisplayed()) {
        await scrollToBottom()
    }

    // delete each video
    while(await deleteVideo()){}
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