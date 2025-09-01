# sakuramusic v2

### Official Instance Invite Link
[Invite your server from here(beta instance)](https://discord.com/api/oauth2/authorize?client_id=887156889455038494&permissions=0&scope=bot%20applications.commands)  

[Invite your server from here(stable instance)](https://discord.com/api/oauth2/authorize?client_id=1133641045813502047&permissions=0&scope=bot%20applications.commands)

### Language Support
Commands are available in English, Japanese, and Korean.

## ja
2021/09にqiitaで公開した[記事](https://qiita.com/_yussy_/items/d2d809a2da82c5389966)に記載されていたSakuraMusicというbotをDiscord.js v14で書き直したうえで複数の機能を追加したものです。

#### 動作確認済みの機能
・スラッシュコマンドに完全対応  
・音楽再生/停止/一時停止  
・曲のスキップ  
・ループ機能(1曲・キュー)  
・キューに曲を追加  
・キューに曲がある場合は連続再生  
・キューに曲がなくなったら自動で切断  
・キューの表示  
・キューのクリア  
・現在再生中の曲に関する情報の表示  
・曲の存在確認  
・音量調節
・再生位置の変更(シーク)
・pingの確認
・曲指定スキップ
・曲指定スキップの際にもしキューループが有効な場合はスキップした曲をキューの末尾に追加する
・キューのシャッフル
・添付ファイルからの再生(リンクは2時間で無効)
・再生履歴の表示と履歴からの再生
・プレイリストのサポート(v1.1.0以降から正式サポート)
・youtube APIを使用しない曲の検索機能(v1.2.0以降から正式サポート)
・VCに参加している人が0人になったら自動で退出(v1.2.0以降から正式サポート)  
・一度取得したデータを保持しておくことで再取得の手間をなくしネットワーク負荷の軽減と再生までの時間を高速化(v1.3.0以降から正式サポート)  
・メモリがひっ迫した際に自動でキャッシュをクリア(v1.3.0以降から正式サポート)   
・キャッシュ機能を無効化できるオプション(v1.3.0以降から正式サポート)  
・キューが空になった際に自動で最後の曲に関連する曲を流す機能(v1.4.0以降から正式サポート)  
・再生中にbotが再起動した際に自動でVCに再接続し再生を再開する機能(v1.4.0以降から正式サポート)  

#### 未実装/動作未確認/修正が必要な機能


### How2Use
1: ソースコードをクローンする
```
git clone https://github.com/SysLinkTeam/sakuramusic_v2.git
cd sakuramusic_v2
```
2: .envというファイルを作成し下記の情報を入力  
```
token={DiscordBOTのtoken}
```
DiscordBOTのtokenの取得は[developer portal](https://discord.dev)で可能です  
3: ```npm i```で依存パッケージをダウンロード  
4: ```node index.js```で起動  

### 動作確認環境
node 16.15.0  
npm v9.5.0  
discord.js 14.11.0  
@discordjs/voice 0.16.0  
windowsとlinux(ubuntu)で動作確認済み  

## en
The bot called SakuraMusic described in [article](https://qiita.com/_yussy_/items/d2d809a2da82c5389966) published on qiita on 2021/09 has been rewritten in Discord.js v14 and several features have been added.

#### Features confirmed to work
・Full support for slash commands.  
・Play/stop/pause music  
・Track skipping  
・Loop function (one song/queue)  
・Add song to queue  
・Continuous playback if there is a song in the queue  
・Automatic disconnect when no more songs in queue  
・Queue display  
・Clear queue  
・Display information about the currently playing song  
・Confirming the existence of a song  
・Volume control
・Seek within the current track
・Ping confirmation
・Skip to a specific song
・If a queue loop is enabled when a song is skipped, the skipped song will be added to the end of the queue.
・Shuffle queue
・Play from audio attachments (links expire after 2 hours)
・View playback history and replay songs from it
・playlist support(officially supported since v1.2.0)
・Search function for songs without using youtube API (officially supported since v1.2.0)
・Automatic exit from VC when the number of participants reaches zero (officially supported since v1.2.0)  
・Retain data once acquired to reduce network load and speed up playback time (officially supported since v1.3.0)  
・Automatic cache clearing when memory is overloaded (officially supported since v1.3.0)  
・Option to disable the cache function (officially supported since v1.3.0)  

#### Features not yet implemented/not yet tested/need to be fixed

### How2Use
1: Clone source code  

```
git clone https://github.com/SysLinkTeam/sakuramusic_v2.git
cd sakuramusic_v2
````
2: Create a file named .env and enter the following information  
```
token={DiscordBOT token}
```
You can get the DiscordBOT token from the [Developer Portal](https://discord.dev)  
3: Download dependent packages with ```npm i```.  
4: Start with ```node index.js```.  

### System Requirements
node 16.15.0   
npm v9.5.0   
discord.js 14.11.0  
@discordjs/voice 0.16.0    
Tested on windows and linux(ubuntu)
