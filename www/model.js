var model = {};


var localMemo = localforage.createInstance({
	name:"memo"
});


/**
 * ユーザ入力を保存します。
 *
 * @param id テキストの一意ID
 * @param write 入力文字列
 * @returns Promise
 */
function saveGist(id, write){
	return localMemo.setItem(id, write);
}

/**
 * テキストを呼び出します。
 *
 * @param id テキストの一意ID
 * @returns Promise
 */
function getGist(id){
	return localMemo.getItem(id);
}


model.getGistAll = function(){
	return new Promise(function(resolve, reject){
		localMemo.keys().then(function(keys){
			var memos = [];

			keys.forEach(function(key){
				localMemo.getItem(key).then(function(memo){
					memos.push({
						id:key,
						title:'みじっそう',
					});

					if(memos.length === keys.length){
						resolve(memos);
					}
				}).catch(function(){
					console.log('localMemo.' + key + ' is catch');
					reject();
				});
			});
		}).catch(function(){
			console.log('localMemo.keys() is catch');
			reject();
		});
	});
}