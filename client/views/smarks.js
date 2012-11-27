
Template.header.isLayoutActive = function(layout)
{
	if(Session.equals('layout', layout))
		return " active";
};



Template.newsmark.events(sJS.okCancelEvents(
	'#new-smark',
	{
	  ok: function (text, evt) {
	  	var username;
	  	if(Meteor.user().profile) username = Meteor.user().profile.name;
	  	else if(Meteor.user().username) username = Meteor.user().username;
	  	else username = "anonymous";

	  	//trim additional whitespace
	  	text = $.trim(text);

	  	//extract tags from text
	  	//strip em if they are at the end, else leave em, but collect em all
	  	var regexp = new RegExp('#([^\\s]*)','g');
	  	tags = text.match(regexp);
	  	if(tags != null) 
	  	{
	  		for(var i=tags.length - 1; i >=  0; i--){
	  			if((text.lastIndexOf(tags[i]) + tags[i].length) == text.length)
	  			{
	  				text = text.substring(0, text.lastIndexOf(tags[i])-1);
	  				text = $.trim(text);
	  			}
	  		};
	  		tags = _.map(tags, function(tag){return tag.substr(1)});
	  	}

		var _id = Smarks.insert({
		  avatar: username,
		  smark: text,
		  owner: Meteor.userId(),
		  timestamp:new Date().getTime(),
		  tags: tags ? tags : []
		});

		sJS.getEmbedly(text, _id);
		sJS.resetNewPostsBadge(1);

		evt.target.value = '';
	  }
	})
);

// TIMELINE HEADER __________________________________________

Template.timeline_header.tagFilters = function() {
	return Session.get('tag_filters');
};

Template.timeline_header.events({
	'click button.tagfilter':function(evt) {
		var d = _.difference(Session.get('tag_filters'), [this.toString()]);
		if(d.length == 0) d = null;
		Session.set('tag_filters', d);
		//Router.navigate("", true);
	},
	'click button.fav-only':function(evt, tpl)
	{
		if($(evt.target).hasClass('btn-primary')) {
			$(evt.target).removeClass('btn-primary');
			$('.box.smark').fadeIn(function(){
				repositionPosts();
			});
		}
		else {
			$(evt.target).addClass('btn-primary');
			$('.box.smark').not('.favourite').fadeOut(function(){
				repositionPosts();
			});
		}
	}	
});

// NEWS__________________________________________
currentNewsState = 2;

Template.news.showNews = function()
{
	if(Meteor.user())
	{
		if(!$.cookie('newsstate') || ($.cookie('newsstate') < currentNewsState))
		{
			$.cookie('newsstate', currentNewsState, { expires: 366, path: '/' });
			return true;
		}
	}
	return false;
}





