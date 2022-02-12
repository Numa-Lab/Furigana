# ルビ振り Furigana

`resources/` に入っている json ファイルオブジェクトの１層目の value をひらがなに変換します。  
あと `"オークの"` は削除します。  

[Yahoo! の API](//developer.yahoo.co.jp/webapi/jlp/furigana/v2/furigana.html) を利用しています。  

[僕](//github.com/TwoSquirrels)が (NumaLab., として) 作った！  

## License

[MIT License](/LICENSE)  
`(C) 2022 NumaLab.,`  

## Usage

### Environment

- NodeJS が使える
- ネット環境がある
- Yahoo! の API のアプリケーションを登録している
- その Client ID を `/.env` に `YAHOO_APP_ID=ここにID` という形式で記述している
- 変換元の JSON ファイルが `/resources/` 内に入っている
- `npm i` で依存関係をインストールしている

### Execute

```shell
npm start
```

NPM のエラーが出てしまった場合はバージョン関連の問題だと思われますので、  
`/package-lock.json` を削除してもう一度 `npm i` をしてみてください。  

### Result

結果は `/results/` 内に出力されます。  

## Coding

ツールとしての簡易的なスクリプトの為、型チェックやエラーハンドリングなどは行っておりません。  
