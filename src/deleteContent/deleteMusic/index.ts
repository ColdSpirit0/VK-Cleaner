import { driver } from "../../driverInstance";
import { Progress } from "../../progress";
import { Task } from "../../Task";
import { clickElement, findElement, hoverElement, scrollToBottom, waitActionComplete } from "../../utils/selenium";
import { getUserId } from "../vkHelpers";

export async function deleteMusic(progress: Progress) {
    if (progress.task !== Task.DeleteMusic) {
        progress.task = Task.DeleteMusic
    }

    let userId = await getUserId()
    await driver.get(`https://vk.com/audios${userId}?section=all`)

    // load all audios
    let loader = await findElement(".CatalogBlock__autoListLoader")
    do {
        await scrollToBottom()
        await driver.sleep(300)
    } while (await loader.isDisplayed());


    while(await deleteTrack()) {}
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