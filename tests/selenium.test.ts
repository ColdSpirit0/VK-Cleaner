import { initDriver, driver } from "@/driver";
import { findElement, findElements, isElementOverlapped } from "@/utils/selenium";
import assert from "assert/strict"
import path from "path";


describe("_", function () {
    this.beforeAll(async function () {
        await initDriver()
    })

    this.afterAll(async function () {
        await driver.quit()
    })

    describe("findElement", function () {
        this.beforeAll(async function () {
            await driver.get("file://" + path.resolve("./tests/page1.html"))
        })

        describe("safe=false throws error when no element", function () {
            step("now=false", async function () {
                assert.rejects(async () => {
                    await findElement("#no-exists", { now: false, safe: false })
                }, { name: "NoSuchElementError" })
            })

            step("now=true", async function () {
                assert.rejects(async () => {
                    await findElement("#no-exists", { now: true, safe: false })
                }, { name: "NoSuchElementError" })
            })
        })

        describe("safe=true returns null when no element", function () {
            step("now=false", async function () {
                assert.equal(await findElement("#no-exists", { now: false, safe: true }), null)
            })

            step("now=true", async function () {
                assert.equal(await findElement("#no-exists", { now: true, safe: true }), null)
            })
        })

        describe("without params", function () {
            step("returns null when no elements", async function () {
                assert.equal(await findElement("#no-exists"), null)
            })
        })
    })

    describe("findElements", function () {
        this.beforeAll(async function () {
            await driver.get("file://" + path.resolve("./tests/page1.html"))
        })

        describe("safe=false throws error when no elements", function () {
            step("now=false", async function () {
                assert.rejects(async () => {
                    await findElements("#no-exists", { now: false, safe: false })
                }, { name: "NoSuchElementError" })
            })

            step("now=true", async function () {
                assert.rejects(async () => {
                    await findElements("#no-exists", { now: true, safe: false })
                }, { name: "NoSuchElementError" })
            })
        })

        describe("safe=true returns [] when no elements", function () {
            step("now=false", async function () {
                assert.deepEqual(await findElements("#no-exists", { now: false, safe: true }), [])
            })

            step("now=true", async function () {
                assert.deepEqual(await findElements("#no-exists", { now: true, safe: true }), [])
            })
        })

        describe("without params", function () {
            step("returns [] when no elements", async function () {
                assert.deepEqual(await findElements("#no-exists"), [])
            })
        })
    })


    describe("overlapping", async function() {
        this.beforeAll(async function () {
            await driver.get("file://" + path.resolve("./tests/overlapping.html"))
        })

        step("A is not overlapped", async function() {
            const e = await findElement("#A")
            assert.equal(await isElementOverlapped(e), false)
        })

        step("B is overlapped", async function() {
            const e = await findElement("#B")
            assert.equal(await isElementOverlapped(e), true)
        })

        step("C is overlapped", async function() {
            const e = await findElement("#C")
            assert.equal(await isElementOverlapped(e), true)
        })
    })
})

