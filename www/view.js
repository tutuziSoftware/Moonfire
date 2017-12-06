/**
 * 表示に関するAPI。
 * 基本的に見た目はこれを介在する事。
 * @type {{}}
 */
var view = {};

view.showMemoList = function(projects){
	projects.forEach(function(project){
		var title = Object.keys(project.files)[0];

		var memo = Template7.templates.memoTemplate({
			id:project.id,
			title:title,
		});

		$$('#memoList').append(memo);
	});
};

view.clearMemoList = function(){
	$$('#memoList').empty();
};

/**
 * 左パネルにメモ一覧を表示します
 */
view.showLeftMemoList = function(projects){
	projects.forEach(function(project){
		var title = Object.keys(project.files)[0];

		var leftMemoListTemplate = Template7.templates.leftMemoListTemplate({
			id:project.id,
			title:title,
		});

		$$('#leftMemoList').append(leftMemoListTemplate);
	});
};

view.clearLeftMemoList = function(){
	$$('#leftMemoList').empty();
};

/**
 * 右パネルにメニューを表示します。
 * @param menu {
 * 		templateName:'テンプレート名',
 * 		templateData:{
 * 			//テンプレートに流すデータ
 *	 	},
 *	 	onAfter(optional):function(rightPanel){
 *	 		//テンプレート作成後に実行されるイベント
 *	 		//rightPanel: jQueryもどき。イベントを仕掛ける用
 *		}
 * }
 */
view.showRightPanel = function(menu){
	var template = Template7.templates[menu.templateName](menu.templateData);
	var rightPanel = $$('#rightPanel').append(template);

	menu.onAfter && menu.onAfter(rightPanel);
};

view.clearRightPanel = function(){
	$$('#rightPanel').empty();
}

/**
 * codeの入力画面を表示します。
 */
view.showCodeForm = function(){
	mainView.router.loadPage('gist_code.html');
};

view.showFiles = function(projectFiles){
	const files = projectFiles.files;

	Object.keys(files).forEach(function(file){
		files[file].id = projectFiles.id;
		var template = Template7.templates.fileListTemplate(files[file]);
		$$('#fileList').append(template);
	});
};

/**
 * エディタの1行目を必ず<div>で覆う為の関数です。
 *
 * memo: 適切な関数名が思いつかなかった……。あとこれはviewがやることなのか？
 */
view.htmlTitle = function(){
	var title = $$('#editor').html().match(/[^<]*/);
	if(title[0] !== ''){
		$$('#editor').html('<div>'+title[0]+'</div>');
	}
};