var model = {};


var localMemo = localforage.createInstance({
	name:"memo"
});


/**
 * ユーザ入力を保存します。
 *
 * @param write {id:'',title:'',memo:''}
 * @returns Promise
 */
function saveGist(write){
	if(model._checkMemo(write)){
		console.log('error saveGist');
		return;
	}

	return localMemo.setItem(write.id, write);
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

/**
 * すべてのメモを返します。
 * @returns {Promise}
 */
model.getGistAll = function(){
	return new Promise(function(resolve, reject){
		localMemo.keys().then(function(keys){
			var memos = [];

			keys.forEach(function(key){
				localMemo.getItem(key).then(function(memo){
					memos.push(memo);

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

/**
 * データをチェックします。
 * @param arg
 * @private
 */
model._checkMemo = function(arg){
	['id', 'title', 'text'].every(function(key){
		return key in arg;
	});
};