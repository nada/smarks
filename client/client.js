

// collections
Smarks = new Meteor.Collection("smarks");
Favs = new Meteor.Collection("favs");
UserTags = new Meteor.Collection("usertags");
SuperU = new Meteor.Collection("superu");

//routing events via backbone
Router = new SmarksRouter;

Session.set('tag_filters', null);
Session.set('taggingPost', null);

Meteor.subscribe("smarks");
Meteor.subscribe("favs");
Meteor.subscribe("superu");
Meteor.subscribe("usertags");

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});



// TIMELINE HEADER __________________________________________

Template.timeline_header.hasTagFilters = function() {
	return !Session.equals('tag_filters', null);
};

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

// TIMELINE _________________________________________________
Template.timeline.posts = function() {
	var q = {};
	if(!Session.equals("tag_filters", null))
	{
		//q =  {$or:[{tags:{$exists:false}},{tags:{$in:Session.get("tag_filters")}}]};
		q = {tags:{$in:Session.get("tag_filters")}};
	}
	var res = Smarks.find(q, {sort: {timestamp:-1}});
	sJS.updateTitle(res.count());
	return res;
};

Template.timeline.rendered = function() {
	//how to do that in meteor??
	var favDocs = Favs.find({owner:Meteor.userId()}).fetch();
	for(var d in favDocs) {
		$('.box.smark[data-id='+favDocs[d].postId+']').addClass("favourite");
	}
};

// POST _________________________________________________


Template.post.hasTags = function(){
	var numTags = 0;
	if(this.tags != null)
		numTags = this.tags.length;
	numTags += UserTags.find({postId:this._id, owner:Meteor.userId()}).count();
	return (numTags > 0);
};

Template.post.tags = function(){
	
	var userTags = UserTags.findOne({postId:this._id, owner:Meteor.userId()});
	var alltags;
	if(userTags)
	{
		var addedtags = userTags.addedtags || [];
		var suppressedtags = userTags.suppressedtags || [];
		alltags = _.union(this.tags || [], addedtags);
		alltags = _.difference(alltags, suppressedtags);
	}
	else
	{
		alltags = this.tags;
	}

	if(alltags != null) return alltags;
	else return [];
	
};

Template.post.isOwner = function() {
	return (this.owner == Meteor.userId());
}

Template.post.taggingThis = function() {
	return Session.equals('taggingPost', this._id);
}

Template.post.events({
  	'mouseenter': function (evt) { 
  		sJS.resetNewPostsBadge(0);
  		return false;
  	},
  	//editing tags
  	'click .info i.icon-tags': function(evt, tpl) {
  		if(Session.equals('taggingPost', null))
  			Session.set('taggingPost', this._id);
  		else {
  			if(Session.equals('taggingPost', this._id))
  				Session.set('taggingPost', null);
  			else
  				Session.set('taggingPost', this._id);
  		}
  	},
  	//hearts: fav markers
  	'click .info i.icon-heart': function(evt, tpl) {
 		if($(tpl.firstNode).hasClass('favourite'))
		{
			Favs.remove({postId:this._id, owner:Meteor.userId()});
			$(tpl.firstNode).removeClass('favourite');
		}	
		else
		{
			Favs.insert({
		  		owner: Meteor.userId(),
		  		postId: this._id
			});
			$(tpl.firstNode).addClass('favourite');
		}
  	},
  	'click a.avatar':function(evt) {
  		evt.preventDefault();
		console.log("show profile page");
  	},
  	'click i.icon-remove':function(evt) {
  		Smarks.remove({_id:this._id});
		Favs.remove({postId:this._id});
  	},
  	'click a.tag':function(evt){
  		evt.preventDefault();
		Session.set('tag_filters', _.union(Session.get('tag_filters') || [], [evt.target.text]));
  	},
  	/* 
  		these are wired up here, although injected via sJS
  		like this, we can access sparks data :)
  	*/
  	'click button.tag-remove':function(evt, tpl){
  		var tagToRemove = $(evt.target).val();
  		//check if tag was in user tags or has to be removed form smarks tags

  		var tags = tpl.data.tags || [];
	  	var res = UserTags.findOne({postId:tpl.data._id, owner:Meteor.userId()}) || {};
	  	var userAddedTags = res.addedtags || [];
	  	var userSuppressedTags = res.suppressedtags || [];

	  	if(_.indexOf(tags, tagToRemove) >= 0)
	  	{
	  		//refactor: extract
	  		var suppressedtags = _.union(userSuppressedTags, tagToRemove);
	  		if (!res._id)
			{
				UserTags.insert({
		  			postId: tpl.data._id,
					owner: Meteor.userId(),
					addedtags:[],
			  		suppressedtags:suppressedtags
			  	});
			}
			else
			{
				UserTags.update(
					{
		  				postId: tpl.data._id,
						owner: Meteor.userId()
					}, {
			  			$set:{suppressedtags:suppressedtags}
			  		}
			  	);
			}
	  	}
	  	else if(_.indexOf(userAddedTags, tagToRemove) >= 0)
	  	{
	  		//duplicate refactor here!
	  		var addedtags = _.difference(userAddedTags, tagToRemove);
	  		if (!res._id)
			{
				UserTags.insert({
		  			postId: tpl.data._id,
					owner: Meteor.userId(),
			  		addedtags:addedtags,
			  		suppressedtags:[]
			  	});
			}
			else
			{
				UserTags.update(
					{
		  				postId: tpl.data._id,
						owner: Meteor.userId()
					}, {
			  			$set:{addedtags:addedtags}
			  		}
			  	);
			}	
	  	}
  	},
  	'click #taggingSystem a.icon-remove':function(evt) {
  		Session.set('taggingPost', null);
  	}
});

Template.post.events(sJS.okCancelEvents(
	'#new-tag',
	{
	  ok: function (newTag, evt) {
	  	var newTags = _.map(newTag.split(','), function(tag){ return $.trim(tag); });
	  	var tags = this.tags || [];
	  	var res = UserTags.findOne({postId:this._id, owner:Meteor.userId()}) || {};
	  	var userTags = res.addedtags || [];
	  	var alltags = _.union(tags, userTags, newTags);
	  	var addedtags = _.difference(alltags, tags);
	  	
	  	//not ideal but mongo's upsert option is missing in meteor at the moment

	  	//duplicate refactor here!
		if (!res._id)
		{
			UserTags.insert({
	  			postId: this._id,
				owner: Meteor.userId(),
		  		addedtags:addedtags,
		  		suppressedtags:[]
		  	});
		}
		else
		{
			UserTags.update(
				{
	  				postId: this._id,
					owner: Meteor.userId()
				}, {
		  			$set:{addedtags:addedtags}
		  		}
		  	);
		}	
		evt.target.value = '';
	  },
	  cancel: function(evt) {
	  	//out on escape
	  	if(evt.keyCode === 27) {
	  		$(evt.target).blur();
	  		Session.set('taggingPost', null);
	  	}
	  }
	  
	})
);

Template.post.helpers({
  timeSince: function (timestamp) {
    return sJS.timeSince(timestamp);
  },
  totalhearts: function() {
  	var hearts = Favs.find({postId:this._id}).count();
  	return hearts;
  },
  alltags: function() {
  	var alltags = []
	var tagDocs = Smarks.find({}, {tags:1}).fetch();
	for (var d in tagDocs) {
		if(tagDocs[d].tags)
			alltags = _.union(alltags, tagDocs[d].tags);
	}
	var alltagsStr = '[';
	for(var i in alltags)
	{
		alltagsStr += '"'+alltags[i]+'",';
	}
	alltagsStr = alltagsStr.substr(0, alltagsStr.length-1) + ']';
	return alltagsStr;
  }
});

Template.post.rendered = function(){
	sJS.activateInput($('#new-tag'));
}

// PAGE _________________________________________________
currentNewsState = 2;

Template.page.showNews = function()
{
	if(Meteor.userLoaded())
	{
		if(!$.cookie('newsstate') || ($.cookie('newsstate') < currentNewsState))
		{
			$.cookie('newsstate', currentNewsState, { expires: 366, path: '/' });
			return true;
		}
	}
	return false;
}

Template.page.events(sJS.okCancelEvents(
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

		Smarks.insert({
		  avatar: username,
		  smark: text,
		  owner: Meteor.userId(),
		  timestamp:new Date().getTime(),
		  tags: tags ? tags : []
		});
		sJS.resetNewPostsBadge(1);

		evt.target.value = '';
	  }
	})
);

//on init page load, this runs 2 times, can't figure out why...
Template.page.rendered = function () {

	//only do this when the user is loaded
	if(Meteor.userLoaded())
	{
		//go through every post and linkify and ebedly it
		$('.smark .inner').not('.linkified').each(function(){
			var res = sJS.linkify($(this).text());
			$(this).find('span.smark').html(res.text);
			if(res.urls != null)
			{
				var node = $(this).find('div.embedly');
				$.embedly(res.urls, {
						key:'f8fe34981bf2459e850c443dd1e587b7',
						maxWidth: '260px', 
						maxHeight: '260px',
						success: function(oembed, dict){
							//console.log(oembed, dict);
		   					switch(oembed.type)
							{
								case "photo":
									$(node).html('<a href="' + oembed.url + '" target="_blank"><img src="' + oembed.url + '" width="'+oembed.width+'" height="'+oembed.height+'"/></a>');
									break;
								case "link":
									if(oembed.title) {
										$(node).prev().prepend('<span class="title">'+oembed.title+'</span>');
										//console.log($(node).prev().prepend('xxx'));
									}
									if(oembed.thumbnail_url) {
										$(node).html('<a href="' + oembed.url + '" target="_blank"><img src="' + oembed.thumbnail_url + '" width="'+oembed.thumbnail_width+'" height="'+oembed.thumbnail_height+'"/></a>'); 	
									}
									break;
								case "video":
								case "rich":
									$(node).attr("style", "width:"+oembed.width+"px;height:"+oembed.height+"px;");
									$(node).html(oembed.html);
									break;
								default:
									break;
							}
							$(node).removeClass("empty");
							sJS.repositionPosts();  				
						},
						error:function(node, dict) {
							//do nothing than logging for the moment
							console.log("an error occured> node/dict :", node, dict);
							sJS.repositionPosts();
						}
					}
				);
			}
	  	}).addClass("linkified");
	  	sJS.repositionPosts();
	}
	else
	{
		sJS.repositionPosts();
	}
};


// _________________________________________________________________________

Meteor.startup(function () {
	$(window).resize(sJS.repositionPosts);

	Backbone.history.start({pushState: true});

	if (SuperU.find().count() === 0) {
		console.log("no super user set until now!")
	}
});


