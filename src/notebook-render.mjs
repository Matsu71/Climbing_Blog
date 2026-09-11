import {noteStates,noteFocus} from './notebook-model.mjs';
export function renderNotebook({heading,note,link}) {
  const options=o=>Object.entries(o).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  return heading('YOUR NEXT MOVE','登れなかった日にも、発見は残る。','結果だけでなく「何が変わったか」を残す。次のトライが少し具体的になる、あなたのノートです。')+
    note('端末内だけに保存します','アカウント・クラウド同期はありません。ブラウザーのデータを消すと記録も消えます。大切な記録はJSONで書き出してください。医療上の個人情報は入力しないでください。')+
    `<noscript><p>ノートの記録機能にはJavaScriptが必要です。${link('read/projecting-notes/','観察メモの残し方を読む →')}</p></noscript>
    <div data-notebook class="notebook-layout js-only">
      <div><section class="notebook-form-card"><h2 id="note-form-title">トライを記録</h2>
        <form data-note-form aria-labelledby="note-form-title">
          <input type="hidden" name="id">
          <div class="form-pair"><label>登った日<input type="date" name="date" required></label><label>種目<select name="discipline"><option value="boulder">ボルダー</option><option value="sport">リード・スポート</option></select></label></div>
          <label>課題・ルート名<input name="name" maxlength="120" required placeholder="青の3番、挑戦中のルート…"></label>
          <div class="form-pair"><label>グレード（任意）<input name="grade" maxlength="30" placeholder="V5、2級、5.12a…"></label><label>この日のトライ数<input type="number" name="attempts" min="1" max="9999" step="1" value="1" required></label></div>
          <div class="form-pair"><label>結果<select name="result">${options(noteStates)}</select></label><label>気になった点<select name="focus">${options(noteFocus)}</select></label></div>
          <p class="micro">フラッシュは「その課題への初めてのトライで完登」。今日の1回目とは区別します。総合能力の評価には使いません。</p>
          <label>何が起きた？<textarea name="observation" maxlength="2000" rows="3" placeholder="右足が先に外れた。腰を近づけると次の手に触れた。"></textarea></label>
          <label>次に、一つだけ試すなら<textarea name="next" maxlength="1000" rows="2" placeholder="左足を先に上げるベータを試す。"></textarea></label>
          <div class="inline-actions"><button type="submit" class="button" data-note-save>記録を保存</button><button type="button" class="button ghost" data-note-new>新しい記録</button></div>
          <p data-note-status role="status" aria-live="polite"></p>
        </form>
      </section><details class="deep"><summary>書き出し・バックアップの読み込み</summary>
        <p>同じIDの記録は上書きせず、新しい記録だけを追加します。読み込み前に件数を確認できます。</p>
        <button type="button" class="button ghost" data-note-export>すべてJSONで書き出す</button>
        <label class="import-label">保存したJSONを選ぶ<input type="file" accept="application/json,.json" data-note-import></label>
        <p class="micro">最大250件・読み込み1MB。破損したファイルはまとめて拒否し、既存記録は変えません。</p>
      </details><p>${link('read/projecting-notes/','役立つメモと、ただの感想の違い →')}</p></div>
      <section aria-label="保存したトライ"><div class="notebook-summary" data-note-summary></div>
        <div class="note-filters"><label>記録内を検索<input type="search" data-note-query placeholder="課題名・グレード・メモ"></label><label>結果<select data-note-result><option value="">すべて</option>${options(noteStates)}</select></label></div>
        <p data-note-count class="micro" role="status"></p><div data-note-list></div>
      </section>
    </div>`;
}
