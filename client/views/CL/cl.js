

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
  firstEmbedlyTitle:function(){
  	if(this.embedly)
  		return this.embedly[0].title;
  	else
  		return "";
  },
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
	//activate input if tagging
	var smarkdata = this.data;
	var smarknode = $(this.firstNode).find('span.smark');
	//linkify
	$(smarknode).html(sJS.linkify($(smarknode).text()).text);

	if(!Session.equals('taggingPost', null)) sJS.activateInput($('#new-tag'));
	else
	{
		if(this.find('div.embedly') === null)
			sJS.getEmbedly(this.data.smark, this.data._id);
	}
	sJS.repositionPosts();
};

// PAGE _________________________________________________


//on init page load, this runs 2 times, can't figure out why...
Template.view_cl.rendered = function () {
	sJS.repositionPosts();

	$('div.btn-group button').click(function(){
		Session.set('layout',$(this).val());
	});
};


