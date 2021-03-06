var model = {};


var localMemo = localforage.createInstance({
	name:"memo"
});

var gistApi = new GistAPI;


/**
 * Gistのアクセストークンを取得します。
 * @returns {*}
 */
model.getAccessToken = function(){
	var localAccessToken = localforage.createInstance({
		name:"gistAccessToken"
	});

	return localAccessToken.getItem('accessToken');
};

model.initAccessToken = function(){
	gistApi.initAccessToken();
};

model.setCode = function(code){
	return gistApi.setCode(code);
};


/**
 * ユーザ入力を保存します。
 *
 * @param write {id:'',title:'',memo:''}
 * @returns Promise
 */
model.saveGist = function(write){
	if(model._checkMemo(write) === false){
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

model.getGist = getGist;

/**
 * すべてのメモを返します。
 * @returns {Promise}
 */
model.getProjectAll = function(){
	return gistApi.getProjectAll();
}

/**
 * データをチェックします。
 * @param arg
 * @private
 */
model._checkMemo = function(arg){
	return ['id', 'title', 'text'].every(function(key){
		return key in arg;
	});
};