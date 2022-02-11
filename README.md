# ルビ振り Furigana

`resources/` に入っている json ファイルオブジェクトの１層目の value をひらがなに変換します。  
あと `"オークの"` は削除します。  

[Yahoo! の API](https://developer.yahoo.co.jp/webapi/jlp/furigana/v2/furigana.html) を利用しています。  

[僕](@github/TwoSquirrels)が (Numa-Lab として) 作った！  

## License

[MIT License](/LICENSE)  
`(C) 2022 Numa-Lab`  

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

### Result

結果は `/results/` 内に出力されます。  
