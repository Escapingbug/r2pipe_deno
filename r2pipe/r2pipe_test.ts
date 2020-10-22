import { assertEquals, assertNotEquals } from "https://deno.land/std@0.74.0/testing/asserts.ts";
import { R2Pipe } from "./mod.ts";

Deno.test("radare2 basic", async () => {
    /* I know I know, this is not a binary... */
    const r2 = await R2Pipe.open("README.md");
    let ret = await r2.cmd("aaaa");
    assertEquals(ret, "");

    let retJson = await r2.cmdJson("pdf");
    await r2.quit();
});