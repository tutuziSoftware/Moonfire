var controller = {};

controller.reloadMemoList = function(){
	model.getGistAll().then(function(texts){
		view.clearMemoList();
		view.showMemoList(texts);
	});
};