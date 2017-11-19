/**
 * 表示に関するAPI。
 * 基本的に見た目はこれを介在する事。
 * @type {{}}
 */
var view = {};

view.showMemoList = function(texts){
	texts.forEach(function(text){
		var memo = Template7.templates.memoTemplate(text);

		$$('#memoList').append(memo);
	});
};

view.clearMemoList = function(){
	$$('#memoList').empty();
};

/**
 * 左パネルにメモ一覧を表示します
 */
view.showLeftMemoList = function(memos){
	memos.forEach(function(memo){
		var leftMemoListTemplate = Template7.templates.leftMemoListTemplate(memo);
		$$('#leftMemoList').append(leftMemoListTemplate);
	});
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