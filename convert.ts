import path from "path";

import axios from "axios";
import dotenv from "dotenv";
import fs from "fs-extra";
import glob from "glob-promise";

const config = require("./config.json");

(async () => {
  dotenv.config();

  for (let fileName of await glob("resources/**/*.json", { nodir: true })) {
    // load
    fileName = path.relative(__dirname, fileName);
    console.log(`Start ${fileName}\n`);
    const file = (await fs.readJson(fileName, "utf-8")) as {
      [key: string]: string;
    };

    // convert
    let i = 1,
      n = Object.keys(file).length;
    for (let key of Object.keys(file)) {
      if (typeof file[key] !== "string") continue;
      let value: string = file[key];

      // kanji to hiragana
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
      value = (
        (apiResponse.data.result?.word ?? []) as {
          surface: string;
          furigana?: string;
        }[]
      )
        .map((word) => word.furigana ?? word.surface)
        .join("");

      // replace by map
      if (config.replace) {
        for (const from of Object.keys(config.replace))
          value = value.replaceAll(from, config.replace[from]);
      }
      // katakana to hiragana
      // remove dakuten and handakuten
      // normalize small char

      console.log(
        `${i.toString().padStart(5, "0")} ` +
          `(${Math.floor((100 * i) / n)
            .toString()
            .padStart(3, " ")}%): ` +
          `"${file[key]}"\n           -> "${value}"`
      );
      i++;
      file[key] = value;
    }

    // save
    fileName = fileName.replace(/resources/, "results");
    await fs.outputJson(fileName, file, {
      encoding: "utf-8",
      spaces: 4,
    });

    console.log(`\nSaved ${fileName}!\n`);
  }

  console.log("=== DONE ALL! ===");
})().catch(console.error);
