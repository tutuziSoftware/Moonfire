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

/**
 * 左パネルのメモ一覧に関するもの
 */
(function(){
	model.getGistAll().then(function(memos){
		//表示
		view.showLeftMemoList(memos);

		//左パネルからメモを表示
		$$('.leftMemo').on('click', function(){
			if(mainView.history[mainView.history.length-1].match(/editor.html/)){
				//pageがeditor.htmlの場合
				var id = this.dataset.id;
				mainView.router.reloadPage('editor.html?id='+id);
			}else{
				//pageがeditor.html以外の場合
				var id = this.dataset.id;
				mainView.router.load({
					url:'editor.html?id='+id,
				});
			}
		});
	}).catch(function(){
		console.log('getGistAll error');
	});
})();

/**
 * 右パネル
 */
(function(){
	//最初はメニュー呼び出し
	var testMenu = {
		templateName:'rightMenuTemplate',
		templateData:{
			menus:[{
				menuName:'TODO',
			}],
		},
		onAfter:function(rightPanel){
			//TODO メニューが複数になったらループする
			var todoEntry = todo.rightMenuEntry;
			rightPanel.find('#menu0').on(todoEntry.event, todoEntry.listener);
		}
	};

	view.showRightPanel(testMenu);
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
			model.saveGist({
				id:page.query.id,
				title:$$('#editor').children()[0].innerText,
				text:$$('#editor').html(),
			});

			controller.reloadMemoList();
		});

		//データ取得
		getGist(memoId).then(function(memo){
			$$('#editor').html(memo.text);
			$$('#memoId').val(memo.id);
		});
	}else if(page.query.mode === 'newMemo'){
		/*
		 * 新しいメモ
		 */

		//データ保存
		$$('#save').on('click', function(){
			var id = Date.now()+'';
			var title = $$('#editor').children()[0].innerText;
			var text = $$('#editor').html();

			model.saveGist({
				id:id,
				title:title,
				text:text,
			});

			controller.reloadMemoList();
		});
	}

	$$('#editor').on('keyup', function(){
		view.htmlTitle();
	});
});