var ark = angular.module('Ark', []);

ark.controller("saveController", ['$scope', '$http', '$timeout', function($scope, $http, $timeout){
  initOauth($http);
  fetchGists();

  //---private-----------------------------------------------------------------------------------------------
  var api = new GistAPI();
  var selectedGist = {
    gistId:null,
    file:null
  };
  var undo = {
    _layout:[],
    _index:-1,
    addLayout:function(editor){
      this._layout.push(editor);
      this._index = this._layout.length - 1;
    },
    get:function(oldEditor){
      var editor = "";

      if(this._index != -1){
        editor = this._layout[this._index];
        this._index--;
      }else{
        editor = oldEditor;
      }

      return editor;
    }
  };
  
  //---$scope------------------------------------------------------------------------------------------------
  $scope.showGists = true;
  $scope.showSearch = false;
  $scope.showEditor = false;
  $scope.offline = false;
  
  $scope.selectGists = function(gist, file){
    selectedGist.gistId = gist.id;
    selectedGist.file = file;

    console.log("selectGists");

    api.getFile(gist, file).then(function(text){
      console.log("getFile");
      $scope.editor = text.text;
      $scope.showConflict = text.conflict;
      $scope.showEditor = true;
      $scope.showGists = false;
      $scope.offline = false;
      $scope.$apply();
    }).catch(function(error){
      console.log(error);
      if(error == "NETWORK_ERROR"){
        $scope.offline = 2;
        $scope.$apply();
        console.log(error);
      }else if(error == "SERVER_FILE_NOT_EXIST"){
        console.log(error);
      }else{
        console.log("?");
      }
    });
  };
  
  $scope.toggleGists = function(){
    $scope.saveGist();
    
    $scope.showEditor = !$scope.showEditor;
    $scope.showGists = !$scope.showGists;
    $scope.showConflict = false;
  };
  
  $scope.changeName = function(){
    const newFilename = prompt("新しいファイル名");

    api.saveRenameFile(selectedGist.gistId, selectedGist.file, newFilename).then(function(){
      $scope.saved = true;
      $scope.$apply();
    });
  };
  
  $scope.saveGist = function(){
    console.log(selectedGist.gistId);
    if(selectedGist.gistId == null){
      newGist();
      return;
    }

    new Storage(selectedGist.gistId+selectedGist.file.filename).setItem($scope.editor);
    
    new Storage("accessToken").getItem().then(function(accessToken){
      console.log(accessToken);

      var files = {};

      files[selectedGist.file.filename] = {
        content:$scope.editor
      };

      //TODO gistapiに移動する
      new Http({
        url:"https://api.github.com/gists/"+selectedGist.gistId,
        method:"PATCH",
        data:{
          files:files
        },
        headers: {
          Authorization: "token "+accessToken
        }
      }).ajax().then(function(){
        $scope.offline = false;
        $scope.showConflict = false;
        undo.addLayout($scope.editor);
        saved();
      }).catch(function(){
        undo.addLayout($scope.editor);
        $scope.offline = true;
        saved();
      });
    });
  };

  $scope.undo = function(){
    $scope.editor = undo.get($scope.editor);
  };

  $scope.newText = function(){
    $scope.showEditor = true;
    $scope.showGists = false;
  };

  $scope.reload = function(){
    api.reload();
  };
  
  //---functions---------------------------------------------------------------------------------------------
  function newGist(){
    console.log("newGist");

    //TODO ローカル保存の方法を考える

    var gistName = prompt("タイトルを入力してくださ");

    api.createGist(gistName, $scope.editor).then(function(gist){
      console.log(selectedGist.gistId);
      selectedGist.gistId = gist.id;
      console.log(gist);
      console.log(Object.keys(gist)[0], gist.files[Object.keys(gist)[0]]);
      selectedGist.file = gist.files[Object.keys(gist.files)[0]];
      console.log(selectedGist.gistId);
      saved();
      $scope.$apply();
    }).catch(function(){
      $scope.offline = true;
      $scope.$apply();
    });
  }

  /**
   * githubのOAuth承認を行います。
   */
  function initOauth($http){
    const APP_ID = "b3acd7e486cdddfc9a7d";
  
    new Storage("accessToken").getItem()
      .then(initUserData.bind(this, $http))
      .catch(function(){
        window.open("https://github.com/login/oauth/authorize?client_id=b3acd7e486cdddfc9a7d&scope=gist", "_blank");

        var code = prompt('codeを入力してください');
        
        console.log($http);

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
              initUserData($http);
            });
          }
        })
        .error(function(data, status){
          console.log(data, status);
        });
      });
  }
  
  function initUserData($http){
    console.log("_initUserData");
    new Storage("accessToken").getItem().then(function(accessToken){
      $http({
        url:"https://api.github.com/user?access_token="+accessToken,
        method:"GET"
      }).success(function(data){
        new Storage("userId").setItem(data.login);
        fetchGists();
      }).error(function(data){
        console.log(data);
      });
    });
  }
  
  /**
   * gistからデータを取得します。
   * この関数はuserId、accessTokenが存在しない場合、何も行いません。
   */
  function fetchGists(){
    new Storage("userId").getItem().then(function(userId){
      new Storage("accessToken").getItem().then(function(accessToken){
        $http({
          url:"https://api.github.com/users/"+userId+"/gists",
          method:"GET",
          headers: {
            Authorization: "token "+accessToken
          }
        }).success(function(gists){
          console.log(gists);
          $scope.offline = false;

          new Storage("gist").setItem(gists);
          $scope.gists = gists;
        }).error(function(){
          $scope.offline = true;

          new Storage("gist").getItem().then(function(gists){
            $scope.gists = gists;
            $scope.$apply();
            console.log("gist");
          });
        });
      });
    });
  }
  
  function saved(){
    $scope.saved = true;
    
    console.log($scope.saved, $scope.offline);
    
    $timeout(function(){
      $scope.saved = false;
      $scope.offline = false;
    }, 3000);
  }
}]);






function GistAPI(){
  var self = this;

  new Storage("accessToken").getItem().then(function(accessToken){
    self._accessToken = accessToken;
  }).catch(function(){
    self._initOauth();
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

      new Http({
        url:"https://api.github.com/gists",
        method:"POST",
        data:{
          files:files
        },
        headers: {
          Authorization: "token "+accessToken
        }
      }).ajax().then(function(gist){
        resolve(gist);
      }).catch(function(){
        reject();
      });
    }.bind(this));
  }.bind(this));
};
GistAPI.prototype.saveGist = function(selectedGist, editor){
	new Storage(selectedGist.gistId+selectedGist.file.filename).setItem(editor);

	new Storage("accessToken").getItem().then(function(accessToken){
		console.log(accessToken);

		var files = {};

		files[selectedGist.file.filename] = {
			content:editor
		};

		new Http({
			url:"https://api.github.com/gists/"+selectedGist.gistId,
			method:"PATCH",
			data:{
				files:files
			},
			headers: {
				Authorization: "token "+accessToken
			}
		}).ajax().then(function(){
			$scope.offline = false;
			$scope.showConflict = false;
			undo.addLayout($scope.editor);
			saved();
		}).catch(function(){
			undo.addLayout($scope.editor);
			$scope.offline = true;
			saved();
		});
	});
};
/**
 * ファイルをリネームします
 * @param gistId
 * @param file
 * @param newName
 * @returns {Promise}
 */
GistAPI.prototype.saveRenameFile = function(gistId, file, newName){
  const OLD_NAME = file.filename;
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

        new Http({
          url:"https://api.github.com/gists/"+gistId,
          method:"PATCH",
          data:{
            files:files
          },
          headers: {
            Authorization: "token "+accessToken
          }
        }).ajax().then(function(){
          console.log("success");
          new Storage(gistId+OLD_NAME).removeItem().then(function(){
            new Storage(gistId+newName).setItem(content).then(function(){
              resolve();
            });
          });
        }).catch(function(){
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
      new Http({
        url:"https://api.github.com/gists/"+gist.id
      }).ajax().then(function(gist){
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
      }).catch(function(){
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
  return new Promise(function(resolve, reject){
    new Http({
      url:file.raw_url
    }).ajax().then(function(text){
      resolve(text);
    }).catch(function(){
      reject("NETWORK_ERROR");
    });
  });
};
GistAPI.prototype._initOauth = function(){
  const APP_ID = "b3acd7e486cdddfc9a7d";

  window.open("https://github.com/login/oauth/authorize?client_id="+APP_ID+"&scope=gist", "_blank");

  var code = prompt('codeを入力してください');

  new Http({
    url:"https://github.com/login/oauth/access_token",
    method:"POST",
    data:{
      client_id:APP_ID,
      client_secret:"c59721ff0a3e25b174570e43da4070cca81fabb9",
      code:code
    }
  }).ajax()
  .then(function(param){
    console.log(param);
    var accessToken = param.match(/access_token=([^&]*)/)[1];

    if(accessToken != void 0){
      console.log(accessToken);
      new Storage("accessToken").setItem(accessToken).then(function(){
        this._initUserData();
      });
    }
  })
  .catch(function(data, status){
    console.log(data, status);
  });
};
GistAPI.prototype._initUserData = function(){
  var self = this;

  new Storage("accessToken").getItem().then(function(accessToken){
    new Http({
      url:"https://api.github.com/user?access_token="+accessToken,
      method:"GET"
    }).ajax().then(function(data){
      new Storage("userId").setItem(data.login).then(function(){
        self._fetchGists().catch(function(){
          console.log("error");
        });
      });
    }).catch(function(data){
      console.log(data);
    });
  });
};
/**
 * gistからデータを取得します。
 */
GistAPI.prototype._fetchGists = function(){
  return new Promise(function(resolve, reject){
    new Storage("userId").getItem().then(function(userId){
      new Storage("accessToken").getItem().then(function(accessToken){
        new Http({
          url:"https://api.github.com/users/"+userId+"/gists",
          method:"GET",
          headers: {
            Authorization: "token "+accessToken
          }
        }).ajax().then(function(gists){
          new Storage("gist").setItem(gists);
          resolve(gists);
        }).catch(function(){
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
	constructor(param){
		this._ajax = {
			url: 'url' in param ? param.url : "",
			method: 'method' in param ? param.method : 'GET',
			data: JSON.stringify('data' in param ? param.data : {}),
		};

		this._ajax.beforeSend = function(xhr){
		    for(var key in param.headers){
				xhr.setRequestHeader(key, param.headers[key]);
			}
        };
	}

	ajax(){
		//TODO いい感じでXHRを使いまわしてくれる
		return new Promise((resolve, reject) => {
			$.ajax(this._ajax)
            .done(function(data){
				resolve(data);
            })
            .fail(function(){
				reject();
            });
		});
	}
}