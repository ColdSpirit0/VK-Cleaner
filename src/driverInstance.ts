import path from "path";
import { Browser, Builder, WebDriver } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import config from "./config";


export let driver: WebDriver

export async function initDriver() {
    const options = new Options()
    options.addArguments("user-data-dir=" + path.resolve(config.userDataPath))
    options.windowSize({ width: 1200, height: 1000 })

    driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(options)
        .build();

    return driver
}
