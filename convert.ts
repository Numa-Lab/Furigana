import path from "path";

import axios from "axios";
import dotenv from "dotenv";
import fs from "fs-extra";
import glob from "glob-promise";

const DEBUG = false;
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
    let count = 1;
    const n = Object.keys(file).length;
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

      // normalize hiragana
      value = value
        .split("")
        .map((char) => {
          let charCode = char.charCodeAt(0);
          // katakana to hiragana
          if (charCode >= "ァ".charCodeAt(0) && charCode <= "ヶ".charCodeAt(0))
            charCode += "ぁ".charCodeAt(0) - "ァ".charCodeAt(0);
          // exclude not hiragana
          if (
            config.normalize?.symbolic === true &&
            !(
              (charCode >= "ぁ".charCodeAt(0) &&
                charCode <= "ゖ".charCodeAt(0)) ||
              charCode === "ー".charCodeAt(0)
            )
          ) {
            if (DEBUG) console.error(`Excluded "${char}" in "${file[key]}"!`);
            return "";
          }
          if (config.normalize?.dakuten_handakuten === true) {
            // remove dakuten
            if (
              (charCode >= "か".charCodeAt(0) &&
                charCode < "っ".charCodeAt(0) &&
                charCode % 2 === 0) ||
              (charCode >= "つ".charCodeAt(0) &&
                charCode < "な".charCodeAt(0) &&
                charCode % 2 === 1) ||
              (charCode >= "は".charCodeAt(0) &&
                charCode < "ま".charCodeAt(0) &&
                charCode % 3 === 1)
            )
              return String.fromCharCode(charCode - 1);
            if (charCode === "ゔ".charCodeAt(0)) return "う";
            // remove han-dakuten
            if (
              charCode >= "は".charCodeAt(0) &&
              charCode < "ま".charCodeAt(0) &&
              charCode % 3 === 2
            )
              return String.fromCharCode(charCode - 2);
          }
          // normalize small char
          if (config.normalize?.small === true) {
            if (
              (((charCode >= "ぁ".charCodeAt(0) &&
                charCode < "か".charCodeAt(0)) ||
                (charCode >= "ゃ".charCodeAt(0) &&
                  charCode < "ら".charCodeAt(0))) &&
                charCode % 2 === 1) ||
              charCode === "っ".charCodeAt(0) ||
              charCode === "ゎ".charCodeAt(0)
            )
              return String.fromCharCode(charCode + 1);
            if (charCode === "ゕ".charCodeAt(0)) return "か";
            if (charCode === "ゖ".charCodeAt(0)) return "け";
          }
          // normal hiragana
          return String.fromCharCode(charCode);
        })
        .join("");

      if (config.word_log === true) {
        console.log(
          `${count.toString().padStart(n.toString().length, "0")}/${n} ` +
            `(${Math.floor((100 * count) / n)
              .toString()
              .padStart(3, " ")}%): ` +
            `"${file[key]}"\n` +
            " ".repeat(n.toString().length * 2) +
            `       -> "${value}"`
        );
        count++;
      }
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

  console.log("=== DONE ALL! ===\n");
})().catch((error: unknown) => {
  if (axios.isAxiosError(error))
    console.error((error.toJSON() as { stack: string }).stack);
  else console.error(error);
});
