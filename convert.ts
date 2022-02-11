import path from "path";

import axios from "axios";
import dotenv from "dotenv";
import fs from "fs-extra";
import glob from "glob-promise";
import romajiConv from "@koozaki/romaji-conv";

async function promsieAllSeries(promises: Promise<void>[]) {
  for (const promise of promises) {
    await promise;
  }
}

(async () => {
  dotenv.config();

  await Promise.all(
    (
      await glob("resources/**/*.json", { nodir: true })
    ).map(async (fileName: string) => {
      // load
      fileName = path.relative(__dirname, fileName);
      const file: unknown = await fs.readJson(fileName, "utf-8");
      if (!(file instanceof Object)) return;

      // convert
      await promsieAllSeries(
        Object.entries(file).map(async ([key, value]: [string, unknown]) => {
          if (typeof value === "string") {
            const apiResponse = await axios({
              url: "https://jlp.yahooapis.jp/FuriganaService/V2/furigana",
              method: "post",
              headers: {
                "User-Agent": `Yahoo AppID: ${process.env.YAHOO_APP_ID}`,
              },
              data: {
                id: "Numa-Lab/Furigana",
                jsonrpc: "2.0",
                method: "jlp.furiganaservice.furigana",
                params: {
                  q: value,
                  grade: 1,
                },
              },
            });
            if (apiResponse.status !== 200) throw new Error(apiResponse.statusText);
            if (apiResponse.data.error) throw apiResponse.data.error;
            value = (apiResponse.data.result.word as any[])
              .map((word: any) => (word.furigana ?? word.surface) as string)
              .join("");
            value = romajiConv.toHiragana(value as string);
          }
          (file as any)[key] = value;
        })
      );

      // save
      fileName = fileName.replace(/resources/, "results");
      await fs.outputJson(fileName, file, {
        encoding: "utf-8",
        spaces: 4,
      });

      console.log(`done ${fileName.replace(/results[/\\]/, "")}!`);
    })
  );

  console.log("\n=== DONE ALL! ===");
})().catch(console.error);
