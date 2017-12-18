var controller = {};

/**
 * メモ一覧を取得し、表示します。
 */
controller.reloadMemoList = function(){
	var loading = new view.Loading;
	loading.show();

	gistApi.getProjectAll().then(function(projects){
		view.clearMemoList();
		view.showMemoList(projects.data);
		view.clearLeftMemoList();
		view.showLeftMemoList(projects.data);
		loading.hide();
	});
};