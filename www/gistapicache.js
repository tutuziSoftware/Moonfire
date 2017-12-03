class GistApiCache{
	getProjectAll(){
		return new Promise(function(resolve, reject){
			new Storage('project').keys().then(function(projectKeys){
				if(projectKeys.length === 0) resolve([]);

				const length = keys.length;

				projectKeys.forEach(function(project){
					//TODO メモリスト取得

					debugger;
				});
			}).catch(function(){
				reject();
			});
		});
	}

	setItem(id, project){
		return new Storage('project').setItem(id, project);
	}

	setFile(file){
		return new Storage('memos').setItem(file.id+'/'+file.fileName, file);
	}

	clear(){
		new Storage('project').clear();
	}
}