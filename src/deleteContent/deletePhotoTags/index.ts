import { Progress } from "../../progress";
import { Task } from "../../Task";
import { clickElement, findElement, waitActionComplete, waitBrowserClosed, waitForElement, waitForElements } from "../../utils/selenium";
import lodash from "lodash"
import { getProfileUrl, getUserId } from "../vkHelpers";
import { driver } from "../../driverInstance";
import { reporter } from "../deleteLikes/reporter";

export async function deletePhotoTags(progress: Progress) {
    if (progress.task !== Task.DeletePhotoTags) {
        progress.task = Task.DeletePhotoTags
    }

    // get profile url tail
    let profileUrlFull = await getProfileUrl()
    let profileUrlRelative = "/" + lodash.last(profileUrlFull.split("/"))

    let userId = await getUserId()

    let deletedCount = 0
    do {
        deletedCount++
    } while (await deletePhotoTag(userId, profileUrlRelative));
     
    reporter.report("Deleted tags: " + deletedCount)
}

async function deletePhotoTag(userId: number, profileUrlRelative: string): Promise<boolean> {
    // open photos page
    // TODO: check if no photos
    await driver.get(`https://vk.com/tag${userId}`)
    
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

