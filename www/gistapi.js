function GistAPI($http){
	this._$http = $http;

	new Storage("accessToken").getItem().then(function(accessToken){
		this._accessToken = accessToken;
	}).catch(function(){
		this._initOauth($http);
	});
}
GistAPI.prototype.createGist = function(gistName, text){
	return new Promise(function(resolve, reject){
		new Storage("accessToken").getItem().then(function(accessToken){
			var files = {};
			files[gistName ? gistName : "_"] = {
				content:text ? text : "_"
			};

			console.log(files);

			this._$http({
				url:"https://api.github.com/gists",
				method:"POST",
				data:{
					files:files
				},
				headers: {
					Authorization: "token "+accessToken
				}
			}).success(function(gist){
				resolve(gist);
			}).error(function(){
				reject();
			});
		}.bind(this));
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
/**
 * ファイルを取得します。
 * @param gist
 * @param file
 * @returns {Promise}
 */
GistAPI.prototype.getFile = function(gist, file){
	const self = this;
	const $http = this._$http;

	const promise = new Promise(function(resolve, reject){
		const storage = new Storage(gist.id+file.filename);

		storage.getItem().then(function(localText){
			console.log("getFile:then");
			fetch(localText);
		}).catch(function(){
			console.log("getFile:catch");
			fetch();
		});

		function fetch(localText){
			$http({
				url:"https://api.github.com/gists/"+gist.id
			}).success(function(gist){
				const LOCAL_FILE_EXIST = 1;
				const SERVER_FILE_EXIST = 2;
				const FILE_EXIST = 3;

				const localFileExist = !!localText ? LOCAL_FILE_EXIST : 0;
				const serverFileExist = (file.filename in gist.files) ? SERVER_FILE_EXIST : 0;
				const fileExist = localFileExist + serverFileExist;

				const mode = {};
				mode[0] = function(){
					reject("FILE_EXIST");
				};
				mode[LOCAL_FILE_EXIST] = function(){
					resolve({
						localText:localText,
						text:localText
					});
				};
				mode[SERVER_FILE_EXIST] = function(){
					self._fetchRawUrl(file).then(function(text){
						storage.setItem(text).then(function(){
							resolve({
								text:text
							});
						});
					}).catch(function(error){
						reject(error);
					});
				};
				mode[FILE_EXIST] = function(){
					self._fetchRawUrl(gist.files[file.filename]).then(function(serverText){
						console.log(serverText == localText, serverText, localText);
						if(serverText == localText){
							resolve({
								text:localText
							});
						}else{
							resolve({
								conflict:true,
								serverText:serverText,
								localText:localText,
								text:localText
							});
						}
					}).catch(function(error){
						console.log("mode[FILE_EXIST]", error);
						console.log("localText", localText);
						if(localText != undefined){
							resolve({
								text: localText,
								conflict: false
							});
						}else{
							reject("NETWORK_ERROR");
						}
					});
				};

				console.log(fileExist);

				if(mode[fileExist]){
					mode[fileExist]();
				}else{
					reject("?_ERROR");
				}
			}).error(function(){
				if(localText !== void 0){
					resolve({
						localText:localText,
						text:localText
					});
				}else{
					console.log("NETWORK_ERROR");
					reject("NETWORK_ERROR")
				}
			});
		}
	});

	return promise;
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
function Storage(key){
	this._key = key;
}
Storage.prototype.setItem = function(text){
	console.log(this._key, text);
	return localforage.setItem(this._key, text);
};
/**
 * データを取得します。
 * データが存在しない場合、Promiseはcatchを返します。
 */
Storage.prototype.getItem = function(){
	var self = this;

	return new Promise(function (resolve, reject){
		localforage.getItem(self._key).then(function(data){
			if(data == null){
				reject();
			}else{
				resolve(data);
			}
		});
	});
};
Storage.prototype.removeItem = function(){
	return localforage.removeItem(this._key);
}


/**
 * APIと通信する為のクラスです。
 */
class Http{
	constructor(){
		this.url = '';
		this.method = 'GET';
	}

	ajax(){
		//TODO いい感じでXHRを使いまわしてくれる
		return new Promise(function(resolve, reject){
			reject();
		});
	}

	set url(url){
		//TODO いい感じでURLを保存してくれる
	}

	set method(method){
		//TODO いい感じでメソッド指定してくれる
	}

	/**
	 * リクエストヘッダを格納します。
	 */
	set headers(hash){
		//TODO いい感じでリクエストヘッダを識別してくれる
		// headers: {
		// 	Authorization: "token "+accessToken
		// }
	}
}