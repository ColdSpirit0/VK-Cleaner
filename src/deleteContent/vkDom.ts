import { WebElement } from "selenium-webdriver";
import { driver } from "@/driver";
import { clickElement, findElement, findElements } from "@/utils/selenium";

type ElementSearchOptions = {
    now?: boolean
    waitTime?: number
    safe?: boolean
}

export async function findFirstElement(locators: string[], options: ElementSearchOptions = {}): Promise<WebElement> {
    for (const locator of locators) {
        const element = await findElement(locator, options)
        if (element !== null) {
            return element
        }
    }

    return null
}

export async function findFirstElements(locators: string[], options: ElementSearchOptions = {}): Promise<WebElement[]> {
    for (const locator of locators) {
        const elements = await findElements(locator, options)
        if (elements.length > 0) {
            return elements
        }
    }

    return []
}

export async function clickFirstElement(locators: string[], options: ElementSearchOptions = {}): Promise<WebElement> {
    const element = await findFirstElement(locators, options)
    if (element !== null) {
        return await clickElement(element, { ...options, now: true })
    }

    if (options.safe === false) {
        return await clickElement(locators[0], options)
    }

    return null
}

export async function clickTextAction(texts: string[], options: ElementSearchOptions = {}): Promise<WebElement> {
    const locator = buildTextActionLocator(texts)
    return await clickElement(locator, options)
}

export async function findChildElement(parent: WebElement, selectors: string[]): Promise<WebElement> {
    return await driver.executeScript(function(parent: Element, selectors: string[]) {
        for (const selector of selectors) {
            const element = parent.querySelector(selector)
            if (element !== null) {
                return element
            }
        }

        return null
    }, parent, selectors) as WebElement
}

export async function findActiveLikeButtons(): Promise<WebElement[]> {
    const elements = await driver.executeScript(function() {
        const activeSelectors = [
            ".PostButtonReactions--active",
            ".like_btn.active",
            "[data-testid='comment-liked']",
            "[data-testid*='like'][aria-pressed='true']",
            "[aria-pressed='true'][aria-label*='рав']",
            "[aria-pressed='true'][aria-label*='like' i]",
            "[aria-label*='Больше не нравится']",
            "[aria-label*='Убрать'][aria-label*='рав']",
            "[title*='Больше не нравится']",
            "[title*='Убрать'][title*='рав']",
            ".vkuiIcon--like_circle_fill_red_28",
            "[class*='vkitgetColorClass__colorAccentRed']",
            "[class*='colorAccentRed']",
        ]

        const clickableSelector = [
            "button",
            "a",
            "[role='button']",
            "[onclick]",
            ".like_btn",
            ".PostButtonReactions",
            "[data-testid*='like']",
        ].join(",")

        const result: Element[] = []
        const seen = new Set<Element>()

        function classText(element: Element) {
            return typeof element.className === "string"
                ? element.className
                : (element.getAttribute("class") ?? "")
        }

        function metaText(element: Element) {
            return [
                element.getAttribute("data-testid"),
                element.getAttribute("aria-label"),
                element.getAttribute("title"),
                element.getAttribute("role"),
                classText(element),
                element.textContent,
            ].filter(Boolean).join(" ").toLowerCase()
        }

        function isVisible(element: Element) {
            const rect = element.getBoundingClientRect()
            const style = window.getComputedStyle(element)
            return rect.width > 0
                && rect.height > 0
                && style.display !== "none"
                && style.visibility !== "hidden"
                && style.opacity !== "0"
        }

        function closestClickable(element: Element) {
            return element.closest(clickableSelector) ?? element
        }

        function hasLikeSignal(element: Element) {
            const meta = metaText(element)
            return meta.includes("like")
                || meta.includes("лайк")
                || meta.includes("нрав")
                || meta.includes("reaction")
                || meta.includes("серд")
                || meta.includes("postbuttonreactions")
        }

        function hasActiveSignal(element: Element) {
            const meta = metaText(element)
            return element.getAttribute("aria-pressed") === "true"
                || meta.includes("active")
                || meta.includes("--active")
                || meta.includes("liked")
                || meta.includes("comment-liked")
                || meta.includes("red")
                || meta.includes("coloraccentred")
                || meta.includes("больше не нравится")
                || (meta.includes("убрать") && meta.includes("нрав"))
                || element.querySelector(".vkuiIcon--like_circle_fill_red_28, [class*='colorAccentRed'], [class*='colorAccentRed']") !== null
        }

        function addCandidate(element: Element) {
            const target = closestClickable(element)
            if (seen.has(target)) return
            if (!isVisible(target)) return
            if (!hasLikeSignal(target) && !hasLikeSignal(element)) return
            if (!hasActiveSignal(target) && !hasActiveSignal(element)) return

            seen.add(target)
            result.push(target)
        }

        document.querySelectorAll(activeSelectors.join(",")).forEach(addCandidate)
        document.querySelectorAll(clickableSelector).forEach(function(element) {
            if (hasLikeSignal(element) && hasActiveSignal(element)) {
                addCandidate(element)
            }
        })

        return result
    }) as WebElement[]

    return Array.isArray(elements) ? elements : []
}

function buildTextActionLocator(texts: string[]) {
    const textPredicate = texts
        .map(text => [
            `contains(normalize-space(.), ${xpathLiteral(text)})`,
            `contains(@aria-label, ${xpathLiteral(text)})`,
            `contains(@title, ${xpathLiteral(text)})`,
        ].join(" or "))
        .map(predicate => `(${predicate})`)
        .join(" or ")

    return `//*[self::button
        or self::a
        or @role="button"
        or @role="menuitem"
        or @data-testid="dropdownactionsheet-item"
        or contains(@class, "vkuiActionSheetItem")
        or contains(@class, "ActionMenuItem")
        or contains(@class, "ui_actions_menu_item")
        or contains(@class, "FlatButton")
    ][descendant-or-self::*[${textPredicate}]]`
}

function xpathLiteral(value: string) {
    if (!value.includes("'")) {
        return `'${value}'`
    }

    if (!value.includes('"')) {
        return `"${value}"`
    }

    return `concat(${value.split("'").map(part => `'${part}'`).join(`, "'", `)})`
}
