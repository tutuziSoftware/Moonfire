// Initialize your app
var myApp = new Framework7({
	//テンプレート使用
	precompileTemplates: true
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
	// Because we use fixed-through navbar we can enable dynamic navbar
	dynamicNavbar: true
});


/**
 * メモ一覧取得
 */
(function(){
	model.getGistAll().then(function(texts){
		view.showMemoList(texts);
	});
})();


myApp.onPageInit('editor', function (page) {
	if(page.query.id !== void 0){
		//IDが指定された場合

		//一意ID
		var memoId = page.query.id;

		//データ保存
		$$('#save').on('click', function () {
			saveGist(memoId, $$('#editor').html());
		});

		//データ取得
		getGist(memoId).then(function(text){
			$$('#editor').html(text);
		});
	}else if(page.query.mode === 'newMemo'){
		//新しいメモが作成された時

		//データ保存
		$$('#save').on('click', function () {
			saveGist('test', $$('#editor').html());
		});
	}
});