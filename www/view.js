var view = {};

view.showMemoList = function(texts){
	texts.forEach(function(text){
		var memo = Template7.templates.memoTemplate({
			id:text.id,
			title:text.title,
		});

		$$('#memoList').append(memo);
	});
};