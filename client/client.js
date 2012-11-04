

// collections
Smarks = new Meteor.Collection("smarks");
Favs = new Meteor.Collection("favs");
SuperU = new Meteor.Collection("superu");

//routing events via backbone
Router = new SmarksRouter;

Session.set('tag_filters', null);

Meteor.subscribe("smarks");
Meteor.subscribe("favs");
Meteor.subscribe("superu");

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
		console.log($(evt.target).hasClass('btn-primary'));
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
	if(this.tags != null) return (this.tags.length > 0);
	else return false;
};

Template.post.tags = function(){
	if(this.tags != null) return this.tags;
	else return [];
};

Template.post.isOwner = function() {
	return (this.owner == Meteor.userId());
}

Template.post.events({
  	'mouseenter': function (evt) { 
  		sJS.resetNewPostsBadge(0);
  		return false;
  	},
  	//editing tags
  	'click .info i.icon-tags': function(evt) {
  		console.log("edit tags");
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
  	}
});

Template.post.helpers({
  timeSince: function (timestamp) {
    return sJS.timeSince(timestamp);
  },
  totalhearts: function() {
  	var hearts = Favs.find({postId:this._id}).count();
  	return hearts;
  }
});


// PAGE _________________________________________________
currentNewsState = 1;
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
	//go through every post and linkify and ebedly it
	$('.smark .inner').not('.linkified').each(function(){
		var res = sJS.linkify($(this).text());
		$(this).html(res.text);
		if(res.urls != null)
		{
			var node = this;
			$.embedly(res.urls, {
					key:'f8fe34981bf2459e850c443dd1e587b7',
					maxWidth: '260px', 
					maxHeight: '260px',
					success: function(oembed, dict){
	   					switch(oembed.type)
						{
							case "photo":
								$(node).append('<div class="embedly"><a href="' + oembed.url + '" target="_blank"><img src="' + oembed.url + '" width="'+oembed.width+'" height="'+oembed.height+'"/></a></div>');
								break;
							case "link":
								if(oembed.thumbnail_url) {
									$(node).append('<div class="embedly"><a href="' + oembed.url + '" target="_blank"><img src="' + oembed.thumbnail_url + '" width="'+oembed.thumbnail_width+'" height="'+oembed.thumbnail_height+'"/></a></div>'); 	
								}
								break;
							case "video":
							case "rich":
								$(node).append('<div class="embedly" style="width:'+oembed.width+'px;height:'+oembed.height+'px;">' + oembed.html + '</div>');
								break;
							default:
								break;
						}
						sJS.repositionPosts();  				
					},
					error:function(node, dict) {
						//do nothing than logging for the moment
						console.log("an error occured> node/dict :", node, dict);
					}
				}
			);
		}
  	}).addClass("linkified");
  	sJS.repositionPosts();
};

// _________________________________________________________________________

Meteor.startup(function () {
	$(window).resize(sJS.repositionPosts);

	Backbone.history.start({pushState: true});

	if (SuperU.find().count() === 0) {
		console.log("no super user set until now!")
	}
});


