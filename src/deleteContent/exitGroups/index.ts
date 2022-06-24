import { driver } from "../../driverInstance";
import { Progress } from "../../progress";
import { Reporter } from "../../Reporter";
import { Task } from "../../Task";
import { clickElement, findElement, hoverElement, scrollToBottom, waitActionComplete } from "../../utils/selenium";

const reporter = new Reporter(Task.ExitGroups)

export async function exitGroups(progress: Progress) {
    if (progress.task !== Task.ExitGroups) {
        progress.task = Task.ExitGroups
    }

    await driver.get("https://vk.com/groups")

    let loadMoreGroupsElement = await findElement("#ui_groups_load_more")
    while (await loadMoreGroupsElement.isDisplayed()) {
        await scrollToBottom()
    }

    let leavedGroupsCount = 0
    while (await exitGroup()) {
        leavedGroupsCount++
    }

    await reporter.report("Покинуто групп:", leavedGroupsCount)
}

async function exitGroup() {
    let actionsButton = await hoverElement("#groups_list_groups .group_list_row:not(.deleted) .group_row_actions")
    if (actionsButton === null) {
        return false
    }

    await clickElement(
        `//*[class("groups_actions_menu") and class("shown")]`
        + `//*[class("ui_actions_menu_item") and normalize-space(text())="Отписаться"]`, 
        {safe: false}
    )

    // click exit if warning shown
    await clickElement(`//*[class("box_layout")]//button[descendant-or-self::*[normalize-space(text())="Выйти из группы"]]`, {
        waitTime: 500
    })

    // mouse out
    await hoverElement("#groups_list_groups .group_list_row:not(.deleted) .group_row_photo", {now: true, safe: false})

    await waitActionComplete()

    return true
}