import lodash from "lodash"
import { abortSignal, Progress, TaskCancelledError } from "@/classes/Progress";
import { Task } from "@/classes/Task";
import { Reporter } from "@/classes/Reporter";
import { clickElement, findElement, waitActionComplete, waitForElement } from "@/utils/selenium";
import { getProfileUrl, getUserId, openPage } from "../vkHelpers";

const reporter = new Reporter(Task.DeletePhotoTags)


const o = {
    locators: {
        photoThumb: `//*[contains(concat(" ", @class), " PhotosPagePhotoGridItem__photoWrapper")]//ancestor-or-self::a`,
        deleteButton: (profileUrlRelative: string) =>
            `//*[@id="pv_tags"]//*[class("pv_tag_span") and descendant::a[@href="${profileUrlRelative}"]]/parent::*//*[class("delete")]`,
    }
}

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
    let photoThumb = await findElement(o.locators.photoThumb)
    if (photoThumb === null) {
        return false
    }

    await clickElement(photoThumb)

    // wait photo loaded
    await waitForElement("#pv_tags")

    // find self target and click remove
    let deleteButton = await findElement(o.locators.deleteButton(profileUrlRelative))
    await clickElement(deleteButton)
    await waitActionComplete()

    return true
}

