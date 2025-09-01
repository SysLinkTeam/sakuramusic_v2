const translations = {
    en: {
        HELP_TITLE: 'Help',
        HELP_DESCRIPTION: '**play** - Plays a song\n**skip** - Skips a song\n**stop** - Stops the music\n**queue** - Shows the queue\n**nowplaying** - Shows the song that is playing\n**loop** - Loops the queue\n**queueloop** - Loops the queue\n**seek** - Seek to a time in the current song\n**volume** - Changes the volume\n**pause** - Pauses the song\n**resume** - Resumes the song\n**remove** - Removes a song from the queue\n**shuffle** - Shuffles the queue\n**skipto** - Skips to a song in the queue\n**help** - Shows this message\n**ping** - Shows the ping\n**invite** - Invite SakuraMusic v2 to your server\n**autoplay** - Autoplay the music if the queue is empty',
    },
    ja: {
        HELP_TITLE: 'ヘルプ',
        HELP_DESCRIPTION: '**play** - 曲を再生\n**skip** - 曲をスキップ\n**stop** - 音楽を停止\n**queue** - キューを表示\n**nowplaying** - 再生中の曲を表示\n**loop** - 曲をループ\n**queueloop** - キューをループ\n**seek** - 現在の曲の再生位置を変更\n**volume** - 音量を変更\n**pause** - 曲を一時停止\n**resume** - 曲を再開\n**remove** - キューから曲を削除\n**shuffle** - キューをシャッフル\n**skipto** - 指定した曲にスキップ\n**help** - このメッセージを表示\n**ping** - pingを表示\n**invite** - SakuraMusic v2をサーバーに招待\n**autoplay** - キューが空のとき関連曲を自動再生',
    },
    ko: {
        HELP_TITLE: '도움말',
        HELP_DESCRIPTION: '**play** - 노래 재생\n**skip** - 노래 건너뛰기\n**stop** - 음악 정지\n**queue** - 큐 표시\n**nowplaying** - 재생 중인 곡 표시\n**loop** - 곡 반복\n**queueloop** - 큐 반복\n**seek** - 현재 곡의 재생 위치 이동\n**volume** - 볼륨 변경\n**pause** - 곡 일시 정지\n**resume** - 곡 재개\n**remove** - 큐에서 곡 제거\n**shuffle** - 큐 섞기\n**skipto** - 큐의 특정 곡으로 건너뛰기\n**help** - 이 메시지 표시\n**ping** - 핑 표시\n**invite** - SakuraMusic v2를 서버에 초대\n**autoplay** - 큐가 비어 있을 때 자동으로 관련 곡 재생',
    },
};

function t(locale, key) {
    const lang = locale && locale.startsWith('ja') ? 'ja' : locale && locale.startsWith('ko') ? 'ko' : 'en';
    return translations[lang][key] || translations.en[key];
}

module.exports = { t };
