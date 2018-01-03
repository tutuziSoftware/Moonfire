function GistAPI(){}
GistAPI.ACCESS_TOKEN_DB_NAME = 'GistAccessToken';
/**
 * アクセストークンをローカルに持っているかどうかを確認します。
 * @returns {Promise}
 * 				then :アクセストークン保有
 * 				catch:アクセストークンなし
 */
GistAPI.prototype.checkAccessToken = function(){
	return new Promise((resolve, reject)=>{
		new Storage(GistAPI.ACCESS_TOKEN_DB_NAME).getItem('accessToken').then((accessToken)=>{
			if(accessToken !== null){
				this._accessToken = accessToken;
				this._network = new GistApiNetwork();
				this._cache = new GistApiCache();
				resolve();
			}else{
				console.log('Gist accessToken not found');
				reject();
			}
		}).catch(function(){
			reject();
		});
	});
};
GistAPI.prototype.initAccessToken = function(){
	window.open("https://github.com/login/oauth/authorize?client_id=b3acd7e486cdddfc9a7d&scope=gist", "_blank");
};
GistAPI.prototype.setCode = function(code){
	return new Promise(function(resolve, reject){
		$$.ajax({
			url:"https://github.com/login/oauth/access_token",
			method:"POST",
			data:{
				client_id:"b3acd7e486cdddfc9a7d",
				client_secret:"c59721ff0a3e25b174570e43da4070cca81fabb9",
				code:code
			},
			success:function(accessTokenParam){
				var accessToken = accessTokenParam.match(/access_token=([^&]*)/)[1];

				//アクセストークン保存
				new Storage(GistAPI.ACCESS_TOKEN_DB_NAME).setItem('accessToken', accessToken);

				resolve();
			},
			error:function(){
				reject();
			}
		});
	});
};
GistAPI.prototype.createGist = function(data){
	return new Promise(function(resolve, reject){
		this._network.create(data).then((json)=>{
			var result = JSON.parse(json);
			this._cache.setItem(result.id, result);
			resolve();
		}).catch(function(){
			debugger;
			reject();
		});
	}.bind(this));
}
/**
 * ファイルをリネームします
 * @param gistId
 * @param file
 * @param newName
 * @returns {Promise}
 */
GistAPI.prototype.saveRenameFile = function(gistId, file, newName){
	const OLD_NAME = file.filename;
	var $http = this._$http;
	var promise = new Promise(function(resolve, reject){
		new Storage("accessToken").getItem().then(function(accessToken){
			new Storage(gistId+OLD_NAME).getItem().then(function(content){
				const file = {
					filename:newName,
					content:content
				};

				const files = {};
				files[OLD_NAME] = file;

				console.log(files);
				console.log(accessToken);

				$http({
					url:"https://api.github.com/gists/"+gistId,
					method:"PATCH",
					data:{
						files:files
					},
					headers: {
						Authorization: "token "+accessToken
					}
				}).success(function(){
					console.log("success");
					new Storage(gistId+OLD_NAME).removeItem().then(function(){
						new Storage(gistId+newName).setItem(content).then(function(){
							resolve();
						});
					});
				}).error(function(){
					console.log(arguments, this);
					reject();
				});
			});
		});
	});

	return promise;
};
GistAPI.prototype.getProjectAll = function(){
	return new Promise((resolve, reject)=>{
		this._network.getProjectAll().then((networkProjects)=>{
			this._cache.getProjectAll().then((cacheProjects)=>{
				//TODO 時刻見て切り替えた方がいい。キャッシュが最新の場合がある
				this._cache.clear();
				networkProjects.forEach((networkProjects)=>{
					this._cache.setItem(networkProjects.id, networkProjects);
				});
				resolve({
					isNetwork:true,
					data:networkProjects,
				});
			}).catch(()=>{
				//TODO ここも仮
				this._cache.clear();
				networkProjects.forEach((networkProject)=>{
					this._cache.setItem(networkProject.id, networkProject);
				});
				resolve({
					isNetwork:true,
					data:networkProjects,
				});
			});
		}).catch(()=>{
			this._cache.getProjectAll().then((cache)=>{
				resolve({
					isNetwork:false,
					data:cache,
				});
			}).catch(()=>{
				reject();
			});
		});
	});
};
/**
 * ファイルを取得します。
 * @param gist
 * @param file
 * @returns {Promise}
 */
GistAPI.prototype.getFile = function(rawUrl){
	return new Promise((resolve, reject)=>{
		this._network.getFile(rawUrl).then((data)=>{
			const cut = rawUrl.match(/.*\/([^/]*)\/raw\/.*\/([^/]*)$/);
			const projectId = cut[1];
			const fileName = cut[2];

			this._cache.setFile({
				id:projectId,
				fileName:fileName,
				text:data,
			});

			resolve(data);
		}).catch(()=>{
			this._cache.then((cache)=>{
				resolve(cache);
			}).catch(()=>{
				reject('CACHE_ERROR');
			});
		});
	});
};
GistAPI.prototype.getFiles = function(gistId){
	if(gistId === void 0){
		console.log('GistAPI.prototype.getFiles(undefined)');
		return;
	}

	return new Promise(function(resolve, reject){
		new Http({
			url:"https://api.github.com/gists/"+gistId
		}).ajax().then((json)=>{
			resolve(JSON.parse(json));
		}).catch(()=>{
			//TODO ストレージから持ってくる
			debugger;
		});
	});
};
/**
 * サーバ側のテキストを取得し、ローカルに保存しなおします。
 * @returns {Promise}
 */
GistAPI.prototype.reload = function(){
	const self = this;

	const promise = new Promise(function(resolve, reject){
		self._fetchGists().then(function(gists){
			gists.forEach(function(gist){
				console.log(gist);

				Object.keys(gist.files).forEach(function(key){
					const file = gist.files[key];
					const storage = new Storage(gist.id+file.filename);

					self._fetchRawUrl(file).then(function(text){
						storage.setItem(text);
					}).catch(function(){
						reject("NETWORK_ERROR");
					});
				});
			});
		}).catch(function(){
			reject("NETWORK_ERROR");
		});
	});

	return promise;
};
GistAPI.prototype.save = function(_){
	return new Promise((resolve, reject)=>{
		this._network.save(_).then(()=>{
			this._cache.setFile(_);
			resolve();
		}).catch(()=>{
			debugger;
		});
	});
};
/**
 * gistのファイルオブジェクトからテキストを取得します。
 * @param file
 * @returns {Promise}
 * @private
 */
GistAPI.prototype._fetchRawUrl = function(file){
	const $http = this._$http;

	return new Promise(function(resolve, reject){
		$http({
			url:file.raw_url
		}).success(function(text){
			resolve(text);
		}).error(function(){
			reject("NETWORK_ERROR");
		});
	});
};
GistAPI.prototype._initOauth = function($http){
	const APP_ID = "b3acd7e486cdddfc9a7d";

	window.open("https://github.com/login/oauth/authorize?client_id="+APP_ID+"&scope=gist", "_blank");

	var code = prompt('codeを入力してください');

	$http({
		url:"https://github.com/login/oauth/access_token",
		method:"POST",
		data:{
			client_id:APP_ID,
			client_secret:"c59721ff0a3e25b174570e43da4070cca81fabb9",
			code:code
		}
	})
		.success(function(param){
			console.log(param);
			var accessToken = param.match(/access_token=([^&]*)/)[1];

			if(accessToken != void 0){
				console.log(accessToken);
				new Storage("accessToken").setItem(accessToken).then(function(){
					this._initUserData();
				});
			}
		})
		.error(function(data, status){
			console.log(data, status);
		});
};
GistAPI.prototype._initUserData = function(){
	var self = this;
	var $http = this._$http;

	new Storage("accessToken").getItem().then(function(accessToken){
		$http({
			url:"https://api.github.com/user?access_token="+accessToken,
			method:"GET"
		}).success(function(data){
			new Storage("userId").setItem(data.login).then(function(){
				self._fetchGists().catch(function(){
					console.log("error");
				});
			});
		}).error(function(data){
			console.log(data);
		});
	});
};
/**
 * gistからデータを取得します。
 */
GistAPI.prototype._fetchGists = function(){
	var $http = this._$http;
	return new Promise(function(resolve, reject){
		new Storage("userId").getItem().then(function(userId){
			new Storage("accessToken").getItem().then(function(accessToken){
				$http({
					url:"https://api.github.com/users/"+userId+"/gists",
					method:"GET",
					headers: {
						Authorization: "token "+accessToken
					}
				}).success(function(gists){
					new Storage("gist").setItem(gists);
					resolve(gists);
				}).error(function(){
					new Storage("gist").getItem().then(function(gists){
						resolve(gists);
					}).catch(function(){
						reject();
					});
				});
			}).catch(function(){
				reject();
			});
		}).catch(function(){
			reject();
		});
	});
};




/**
 * 永続ストレージにアクセスする為のクラスです。
 */
function Storage(dbName){
	this._storage = localforage.createInstance({
		name: dbName
	});
}
Storage.prototype.setItem = function(key, text){
	return this._storage.setItem(key, text);
};
/**
 * データを取得します。
 * データが存在しない場合、Promiseはcatchを返します。
 */
Storage.prototype.getItem = function(key){
	return new Promise((resolve, reject)=>{
		this._storage.getItem(key).then(function(data){
			if(data == null){
				reject();
			}else{
				resolve(data);
			}
		});
	});
};
Storage.prototype.removeItem = function(key){
	return this._storage.removeItem(key);
};
Storage.prototype.keys = function(){
	return this._storage.keys();
}
Storage.prototype.clear = function(){
	return this._storage.clear();
};



/**
 * APIと通信する為のクラスです。
 */
class Http{
	constructor(param){
		Object.keys(param).forEach((key)=>{
			this[key] = param[key];
		});
	}

	ajax(){
		//TODO いい感じでXHRを使いまわしてくれる
		return new Promise((resolve, reject)=>{
			this.success = function (data) {
				resolve(data);
			};

			this.error = function () {
				reject();
			};

			$$.ajax(this);
		});
	}
}