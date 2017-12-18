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
	controller.reloadMemoList();
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
			menus:[],
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
			gistApi.save({
				id:page.query.id,
				fileName:page.query.filename,
				text:$$('#editor').html(),
			}).then(()=>{
				var notificationHandle = myApp.addNotification({
					title: 'MoonFire',
					message: page.query.filename + ' saved'
				});

				setTimeout(()=>{
					myApp.closeNotification(notificationHandle);
				}, 1000);
			}).catch(()=>{
				debugger;
			});

			//controller.reloadMemoList();
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

	var loading = new view.Loading;
	loading.show();

	gistApi.getFiles(gistId).then((files)=>{
		view.showFiles(files);
		loading.hide();
	}).catch(()=>{
		console.log('gistApi.getFiles().catch');
		loading.hide();
	});
});

myApp.onPageBack('files', function(){
	controller.reloadMemoList();
});