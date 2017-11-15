/**
 * ユーザ入力を保存します。
 *
 * @param id テキストの一意ID
 * @param write 入力文字列
 * @returns Promise
 */
function saveGist(id, write){
	return localforage.setItem(id, write);
}

/**
 * テキストを呼び出します。
 *
 * @param id テキストの一意ID
 * @returns Promise
 */
function getGist(id){
	return localforage.getItem(id);
}