import { By, Locator, WebElement } from "selenium-webdriver"

export function isString(v): v is string {
    return typeof v === "string"
}

export function isWebElement(v): v is WebElement {
    // XXX: find better solution
    return v?.click !== undefined
}

