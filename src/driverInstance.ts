import path from "path";
import { Browser, Builder, WebDriver } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import config from "./config";
import fs from "fs"
import { isExists } from "./utils/fs";


export let driver: WebDriver


export async function initDriver() {
    if (await isExists(config.userDataPath)) {
        await fixExitType()
    }

    const options = new Options()
    options.addArguments(
        "user-data-dir=" + path.resolve(config.userDataPath),
    )

    if (config.openDevTools) {
        options.addArguments(
            "auto-open-devtools-for-tabs",
            "start-maximized",
        )
    }

    options.excludeSwitches("enable-logging")
    options.windowSize({ width: 1200, height: 1000 })


    driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(options)
        .build();

    const manage = driver.manage();
    // -1 not working
    manage.setTimeouts({script: 99999999999})

    if (config.startMaximized) {
        manage.window().maximize()
    }

    return driver
}

async function fixExitType() {
    const prefsPath = "./seleniumUserData/Default/Preferences";
    let content = await fs.promises.readFile(prefsPath, {encoding: "utf-8"})
    let newContent = content.replace(/"exit_type":"Crashed"/, `"exit_type":"Normal"`)
    if (content !== newContent) {
        await fs.promises.writeFile(prefsPath, newContent, {encoding: "utf-8"})
    }
}