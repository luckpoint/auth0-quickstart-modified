## MFA 電話番号再設定デモ

### 概要

このデモアプリケーションは、MFAの電話番号の再設定を行うことを示すためのデモです。
前提として、ユーザーが登録できるMFA要素は電話番号(SMS)のみとなります。
※ 複数のMFA要素がある場合には対応していません。

再設定時には標準のUIを利用するようになっています。

### コードの概要

#### server.js

`server.js`はExpressアプリケーションのメインエントリーポイントです。以下の機能を含んでいます：

1. **環境変数**：`dotenv`パッケージを使用して環境変数を読み込みます。
2. **Expressのセットアップ**：Expressアプリケーションのインスタンスを初期化します。
3. **ミドルウェアの設定**：
   - **morgan**：HTTPリクエストのロギングに使用されます。
   - **cookie-parser**：クライアントリクエストオブジェクトに添付されたクッキーを解析します。
   - **express.urlencoded**：URLエンコードされたペイロードを持つ着信リクエストを解析します。
   - **express-openid-connect**：認証および認可機能を提供します。
   - **tiny-csrf**：CSRF保護ミドルウェア。
   - **express-session**：セッション管理ミドルウェア。

4. **ルーター**：一部のルーティングは `./routes/index` に移譲しています。

5. **HTTPサーバー**：指定されたポートでリッスンするHTTPサーバーを作成します。

#### index.js

`index.js`は主にプロフィール画面の表示（この画面で電話番号の登録・削除を行えます）をします。

**MFA（多要素認証）の処理**：特定のユーザーのMFA要素を取得・削除するためのユーティリティ関数を実装しています

### .envファイルのセットアップ方法

1. Expressアプリケーションのルートディレクトリに`.env`という名前のファイルを作成します。
2. 上記の変数を`.env`ファイルに追加し、それぞれに適切な値を割り当てます。例：
   ```
   CLIENT_ID=yourClientId
   DOMAIN=yourTenantDomain
   MGMT_CLIENT_ID=yourMgmtClientId
   MGMT_CLIENT_SECRET=yourMgmtClientSecret
   ISSUER_BASE_URL=https://yourTenantDomain
   SECRET=yourLongRandomlyGeneratedString
   PORT=3000
   ```
- `CLIENT_ID`: 認証プロバイダー（例：Auth0）から取得したアプリケーションのクライアントID。
- `DOMAIN`: Auth0テナント（または他の認証サービス）のドメイン。
- `MGMT_CLIENT_ID`: 認証プロバイダーの管理API用のクライアントID。
- `MGMT_CLIENT_SECRET`: 管理API用のクライアントシークレット。
- `ISSUER_BASE_URL`: 発行者のベースURL（例：Auth0の場合は`https://your-tenant-domain`）。
- `SECRET`: セッション管理とCSRFトークン生成用の長くランダムに生成された文字列。この値の安全性を保つことが重要です。
- `PORT`: Expressサーバーがリッスンするポート番号。デフォルトは`3000`です。

3. `.env`ファイルがバージョン管理にプッシュされないように、このファイルを`.gitignore`ファイルに含めることを確認してください。

### このアプリケーションの使用方法

1. **セットアップ**：
   - システムにNode.jsがインストールされていることを確認します。
   - `npm install`を使用して必要なパッケージをインストールします。

2. **環境変数**：
   - `server.js`と`index.js`で使用される変数を含む`.env`ファイルを作成します。
   - Auth0の設定・セッション管理のためのシークレット情報を含みます

3. **アプリケーションの開始**：
   - `node server.js`でアプリケーションを実行します。
   - 指定されたポートでWebブラウザーを介してアプリケーションにアクセスします。

### 電話番号表示について

今回Managment APIを利用して電話番号を取得していますが、デフォルトの設定では電話番号は下４桁以外はマスクされています。
これを解除するためには、テナント設定を変更する必要があります。

disable_management_api_sms_obfuscation というテナント設定を有効にすることでマスク処理を解除できます。
電話番号を下４桁の表示のみで問題ない場合は、disable_management_api_sms_obfuscationを有効にする必要はありません。

例）NodeJSのスクリプトで更新を行うサンプルです
```
const auth0 = require("auth0");
async function main() {
  const data = {
    "flags": { "disable_management_api_sms_obfuscation": true }
  }
  const ManagementClient = auth0.ManagementClient;
  const client = new ManagementClient({
    domain: 'your-domain',
    clientId: 'your-mgmt-clientId',
    clientSecret: 'your-mgmt-clientSecret',
    scope: "update:tenant_settings"
  });
  const result = await client.tenants.updateSettings(data).catch(e => e);
  console.log(result)
}
main();
```

### 注意事項

このデモアプリはあくまでデモ用のため、本番利用に適していません。
詳細な使用方法や追加機能については、`server.js`と`index.js`の具体的なコードを参照してください。
