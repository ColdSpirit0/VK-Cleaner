import { driver } from "../../driverInstance";
import { Progress } from "../../progress";
import { Reporter } from "../../Reporter";
import { Task } from "../../Task";
import { clickElement, findElement, hoverElement, scrollToBottom, waitActionComplete } from "../../utils/selenium";

const o = {
    groupsURL: `https://vk.com/groups/my_all_groups`,

    locators: {
        loadMore: `#spa_root .vkuiSpinner__host`,
        actionsButton: `//*[@data-testid="desktop_group_item_button" and not(descendant-or-self::*[
            normalize-space(text())="Подписаться"
            or normalize-space(text())="Подать заявку"
        ])]`,
        actionUnsubscribe: `//*[@data-testid="dropdownactionsheet-item" and descendant-or-self::*[normalize-space(text())="Отписаться"]]`,
        warningModalUnsubscribe: `//*[@id="box_layer"]//*[class("FlatButton") and descendant-or-self::*[normalize-space(text())="Отписаться"]]`,
    }
}

const reporter = new Reporter(Task.ExitGroups)

export async function exitGroups(progress: Progress) {
    await driver.get(o.groupsURL)

    while (await findElement(o.locators.loadMore)) {
        await scrollToBottom()
        await waitActionComplete()
    }

    let leavedGroupsCount = 0
    while (await exitGroup()) {
        leavedGroupsCount++
    }

    await reporter.report("Покинуто групп:", leavedGroupsCount)
}

async function exitGroup() {
    let actionsButton = await hoverElement(o.locators.actionsButton)
    if (actionsButton === null) {
        return false
    }

    await clickElement(o.locators.actionUnsubscribe, { safe: false })

    // click exit if warning shown
    await clickElement(o.locators.warningModalUnsubscribe, { waitTime: 500 })

    // mouse out
    // await hoverElement("#groups_list_groups .group_list_row:not(.deleted) .group_row_photo", { now: true, safe: false })

    await waitActionComplete()

    return true
}