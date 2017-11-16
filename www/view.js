var view = {};

view.showMemoList = function(texts){
	texts.forEach(function(text){
		var memo = Template7.templates.memoTemplate(text);

		$$('#memoList').append(memo);
	});
};