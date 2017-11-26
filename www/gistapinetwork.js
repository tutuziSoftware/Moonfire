class GistApiNetwork{
	getProjectAll(){
		return new Promise(function(resolve, reject){
			//アクセストークンの取得だけはここでやる。その他のキャッシュはgistapicache.jsに
			new Storage('GistAccessToken').getItem('accessToken').then(function (accessToken) {
				new Http({
					url:"https://api.github.com/user?access_token="+accessToken,
					method:"GET"
				}).ajax().then(function (data) {
					var userId = JSON.parse(data).login;

					new Http({
						url:"https://api.github.com/users/"+userId+"/gists",
						method:"GET",
						headers: {
							Authorization: "token "+accessToken
						}
					}).ajax().then(function (list) {
						var list = JSON.parse(list);
						resolve(list);
					}).catch(function () {
						console.log("error https://api.github.com/users/"+userId+"/gists");
						reject();
					});
				}).catch(function () {
					console.log('error https://api.github.com/user');
					reject();
				});
			}).catch(function () {
				console.log("new Storage('accessToken').getItem().catch");
				reject();
			});
		});
	}
}