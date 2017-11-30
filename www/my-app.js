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

var gistApi = new GistAPI;

gistApi.checkAccessToken().then(function(){
	/**
	 * メモ一覧取得
	 */
	(function(){
		gistApi.getProjectAll().then(function(projects){
			view.showMemoList(projects.data);
		});
	})();

	/**
	 * 左パネルのメモ一覧に関するもの
	 */
	(function(){
		gistApi.getProjectAll().then(function(projects){
			//表示
			view.showLeftMemoList(projects.data);

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
}).catch(function(){
	gistApi.initAccessToken();
	view.showCodeForm();

	myApp.onPageInit('gist_code', function(page){
		/**
		 * code入力確認ボタン
		 */
		$$('#code_submit').on('click', function(){
			var codeForm = myApp.formToData('#code_form');
			var code = codeForm.code;

			model.setCode(code).then(function(){
				mainView.router.back();
			}).catch(function(){
				alert('code error!');
			});
		});
	});
});

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
		gistApi.getFile(page.query.raw_url).then((memo)=>{
			$$('#editor').html(memo.replace(/([^\n\r]*)\r?\n/g, '<div>$1</div>'));
			$$('#memoId').val(memoId);
		}).catch(()=>{
			debugger;
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
});



myApp.onPageInit('files', function (page){
	var gistId = page.query.id;

	gistApi.getFiles(gistId).then((files)=>{
		view.showFiles(files);
	}).catch(()=>{
		console.log('gistApi.getFiles().catch');
	});
});