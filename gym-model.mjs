// The same definitions are used in static details and interactive comparison.
export const gymStatus = g => g.status === 'closed' ? '閉店（履歴）' : '営業案内あり';
export const displayBool = value => value === true ? '公式で確認' : value === false ? 'なし（公式確認）' : '未登録・未確認';
export const height = value => value == null ? '未登録・未確認' : `${value} m`;
export function gymRows(g) {
  return [['状態',gymStatus(g)],['所在地',g.address],['アクセス',g.access],
    ['確認できた種目',g.disciplines.join(' / ') || '未登録・未確認'],
    ['ボルダー壁高',height(g.boulder_height_m)],['ロープ壁高',height(g.rope_height_m)],
    ['オートビレイ',displayBool(g.auto_belay)],['キャンパスボード',displayBool(g.campus_board)],
    ['MoonBoard',displayBool(g.moonboard)],['Kilter Board',displayBool(g.kilterboard)],
    ['閉店日',g.closed_date ?? '未登録・未確認'],['公式情報の確認記録',g.checked_at]];
}
export function gymSelection(value, gyms) {
  const known = new Set(gyms.map(g => g.id));
  return [...new Set(String(value ?? '').slice(0,500).split(',').filter(id => known.has(id)))].slice(0,3);
}
