import { driver } from "../../driverInstance";
import { Progress } from "../../progress";
import { Reporter } from "../../Reporter";
import { Task } from "../../Task";
import { clickElement, findElement, findElements, hoverElement, injectCSS, waitActionComplete } from "../../utils/selenium";
import { getUserId } from "../vkHelpers";

const reporter = new Reporter(Task.DeleteWall)

export async function deleteWall(progress: Progress) {
    if (progress.task !== Task.DeleteWall) {
        progress.task = Task.DeleteWall
    }

    let userId = await getUserId()
    await driver.get(`https://vk.com/wall${userId}`)
    await injectCSS(`
    .dld {
        display: none !important;
    }
    `)

    let deletedPostsCount = 0
    while(await deletePost()) {
        deletedPostsCount++
    }
    await reporter.report("Удалено постов:", deletedPostsCount)
}

async function deletePost(): Promise<boolean> {
    const visiblePostSelector = `//*[class("post") and not(descendant::*[class("dld") and not(contains(@style, "display: none"))])]`
    const postActionsSelector = visiblePostSelector + `//*[class("PostHeaderActions")]`
    const deleteButtonSelector = postActionsSelector + `//*[class("ui_actions_menu_item") and normalize-space(text())="Удалить запись"]`
    const loadMoreButtonSelector = `#fw_load_more`

    let posts = await findElements(visiblePostSelector)
    if (posts.length === 0) {
        // if no posts, try load more
        let loadMoreButton = await findElement(loadMoreButtonSelector)
        if (loadMoreButton !== null && await loadMoreButton.isDisplayed()) {
            await clickElement(loadMoreButton)
            await waitActionComplete()
        }
        // if cant load, return false
        else {
            return false
        }
    }
    
    await hoverElement(postActionsSelector, {safe: false})
    await clickElement(deleteButtonSelector, {safe: false})
    await waitActionComplete()
    return true
}
