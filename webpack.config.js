const webpack = require('webpack');
// [定数] webpack の出力オプションを指定
// 'production' か 'development' を指定
const MODE = "production";

// ソースマップの利用有無(productionのときはソースマップを利用しない)
const enabledSourceMap = MODE === "development";

module.exports = {
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: MODE,
  
  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: `./src/index.js`,

  // ファイルの出力設定
  output: {
    //  出力ファイルのディレクトリ名
    path: `${__dirname}/dist/app`,
    // 出力ファイル名
    filename: "main.js"
  },

  module: {
    rules: [
      //CSSファイルの読み込み
      {
        //対象となるファイルの拡張子
        test: /\.css/,
        //ローダー名
        use: [
          //linkタグに出力する機能
          "style-loader",
          //CSSをバンドルするための機能
          {
            loader: "css-loader",
            options: {
              //オプションでCSS内のurl()メソッドの取り込みを行うかどうか 
              url: true, 
              //ソースマップを有効にする
              sourceMap: enabledSourceMap
            }
          }
        ]
      },
      {
        test: /\.(jpg|png|svg|gif)$/,
        use: {
          loader: 'url-loader',
          options: {
            name: './dist/image/[name].[ext]',
          },
        },
      },
    ],
  },
  devServer: {
    contentBase: "dist",
    open: true
  }
};