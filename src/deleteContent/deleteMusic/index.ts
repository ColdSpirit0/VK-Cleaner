import { driver } from "@/driver";
import { abortSignal, Progress, TaskCancelledError } from "@/classes/Progress";
import { Reporter } from "@/classes/Reporter";
import { Task } from "@/classes/Task";
import { findElement, hoverElement, scrollToBottom, waitActionComplete } from "@/utils/selenium";
import { getUserId, openPage } from "../vkHelpers";
import { clickFirstElement } from "../vkDom";

const reporter = new Reporter(Task.DeleteMusic)

export async function deleteMusic(progress: Progress) {
    let userId = await getUserId()
    if (userId === null) {
        await reporter.report("Не удалось определить userId")
        return
    }

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
    const trackSelector = `//*[class("audio_page__audio_rows_list")]//*[class("audio_row") and not(class("audio_row__deleted"))] |
        //*[(contains(@class, "AudioRow") or @data-testid="audio_row" or @data-testid="audio-track") and not(contains(@class, "deleted"))]`
    const deleteButtonSelectors = [
        trackSelector + `//*[@data-action="delete" or contains(@data-testid, "delete") or contains(@aria-label, "Удалить") or contains(@title, "Удалить")]`,
        `[data-action="delete"]`,
        `[data-testid*="audio"][data-testid*="delete"]`,
        `[aria-label*="Удалить"][aria-label*="аудио"]`,
        `[title*="Удалить"][title*="аудио"]`,
    ]

    let track = await hoverElement(trackSelector)
    if (track === null) {
        return false
    }

    await clickFirstElement(deleteButtonSelectors, {safe: false})
    await waitActionComplete()
    return true
}
