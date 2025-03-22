import { abortSignal, Progress, TaskCancelledError } from "../../progress";
import { Task } from "../../Task";
import { clickElement, findElement, waitActionComplete, waitForElement } from "../../utils/selenium";
import lodash from "lodash"
import { getProfileUrl, getUserId, openPage } from "../vkHelpers";
import { driver } from "../../driverInstance";
import { Reporter } from "../../Reporter";

const reporter = new Reporter(Task.DeletePhotoTags)

export async function deletePhotoTags(progress: Progress) {
    // get profile url tail
    let profileUrlFull = await getProfileUrl()
    let profileUrlRelative = "/" + lodash.last(profileUrlFull.split("/"))

    let userId = await getUserId()

    let deletedTagsCount = 0
    while (await deletePhotoTag(userId, profileUrlRelative)) {
        if (abortSignal.aborted) throw new TaskCancelledError()
        deletedTagsCount++
    } 
    await reporter.report("Удалено тегов с фото:", deletedTagsCount)
}

async function deletePhotoTag(userId: number, profileUrlRelative: string): Promise<boolean> {
    // open photos page
    await openPage(`https://vk.com/tag${userId}`)
    
    // open first photo
    let photoThumb = await findElement(`#photos_container_photos .photos_row`)
    if (photoThumb === null) {
        return false
    }

    await clickElement(photoThumb)

    // wait photo loaded
    await waitForElement("#pv_tags")

    // find self target and click remove
    let deleteButton = await findElement(`//*[@id="pv_tags"]//*[class("pv_tag_span") and descendant::a[@href="${profileUrlRelative}"]]/ancestor::*//*[class("delete")]`)
    await clickElement(deleteButton)
    await waitActionComplete()

    return true
}

