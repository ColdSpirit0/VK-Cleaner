import { driver } from "@/driver";
import { abortSignal, Progress, TaskCancelledError } from "@/classes/Progress";
import { Reporter } from "@/classes/Reporter";
import { Task } from "@/classes/Task";
import { clickElement, findElement, hoverElement, scrollToBottom, waitActionComplete } from "@/utils/selenium";
import { getUserId, openPage } from "../vkHelpers";

const reporter = new Reporter(Task.DeleteMusic)

export async function deleteMusic(progress: Progress) {
    let userId = await getUserId()
    await openPage(`https://vk.com/audios${userId}?section=all`, reporter)

    // load all audios
    let loader = await findElement(".CatalogBlock__autoListLoader")
    if (loader !== null) {
        do {
            if (abortSignal.aborted) throw new TaskCancelledError()
            await scrollToBottom()
            await driver.sleep(300)
        } while (await loader.isDisplayed());
    }

    let tracksDeletedCount = 0
    while(await deleteTrack()) {
        if (abortSignal.aborted) throw new TaskCancelledError()
        tracksDeletedCount++
    }
    await reporter.report("Удалено треков:", tracksDeletedCount)
}

async function deleteTrack() {
    const trackSelector = `//*[class("audio_page__audio_rows_list")]//*[class("audio_row") and not(class("audio_row__deleted"))]`
    const deleteButtonSelector = trackSelector + `//*[@data-action="delete"]`

    let track = await hoverElement(trackSelector)
    if (track === null) {
        return false
    }

    await clickElement(deleteButtonSelector, {safe: false})
    await waitActionComplete()
    return true
}