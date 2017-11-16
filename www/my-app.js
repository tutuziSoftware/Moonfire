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
		/*
		 * 既存のメモ
		 */

		//一意ID
		var memoId = page.query.id;

		//データ保存
		$$('#save').on('click', function () {
			saveGist({
				id:page.query.id,
				title:$$('#editor').children()[0].innerText,
				text:$$('#editor').html(),
			});
		});

		//データ取得
		getGist(memoId).then(function(memo){
			$$('#editor').html(memo.text);
		});
	}else if(page.query.mode === 'newMemo'){
		/*
		 * 新しいメモ
		 */

		//データ保存
		$$('#save').on('click', function(){
			var id = '';//TODO 仮
			var title = $$('#editor').children()[0].innerText;
			var text = $$('#editor').html();

			saveGist({
				id:id,
				title:title,
				text:text,
			});
		});
	}
});