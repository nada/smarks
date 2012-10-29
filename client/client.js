

// ----------------main
Smarks = new Meteor.Collection("smarks");
Favs = new Meteor.Collection("favs");

Meteor.subscribe("smarks");
Meteor.subscribe("favs");

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});


// TIMELINE _________________________________________________
Template.timeline.posts = function() {
	var res = Smarks.find({}, {sort: {timestamp:-1}});
	sJS.updateTitle(res.count());
	return res;
};

Template.timeline.rendered = function() {
	var favDocs = Favs.find({owner:Meteor.userId()}).fetch();
	for(var d in favDocs) {
		$('.box.smark[data-id='+favDocs[d].postId+']').addClass("favourite");
	};

	$('.btn.fav-only').click(function() {
		if($(this).hasClass('btn-primary')) {
			$(this).removeClass('btn-primary');
			$('.box.smark').fadeIn(function(){
				repositionPosts();
			});
		}
		else {
			$(this).addClass('btn-primary');
			$('.box.smark').not('.favourite').fadeOut(function(){
				repositionPosts();
			});
		}
	});
};

// POST _________________________________________________

Template.post.rendered = function () {
	//wire up trash and fav icon
	var postId = this.data._id;
	$(this.firstNode).attr("data-id", postId);
	if(this.data.owner !== Meteor.userId())
	{
		$(this.find('i.icon-trash')).css('display', 'none');
	}
	else
	{
		$(this.find('i.icon-trash')).unbind('click').click(function(){
			Smarks.remove({_id:postId});
			Favs.remove({postId:postId});
		});
	}

	$(this.find('i.icon-heart')).unbind('click').click(function(){
		//toggle favs
		if($(this).parents('.box.smark').hasClass('favourite'))
		{
			//remove fav marker
			Favs.remove({postId:postId, owner:Meteor.userId()});
			$(this).parents('.box.smark').removeClass('favourite');
		}	
		else
		{
			//mark fav
			Favs.insert({
		  		owner: Meteor.userId(),
		  		postId: postId
			});
			$(this).parents('.box.smark').addClass('favourite');
		}
	});
};

Template.post.events({
  	'mouseenter': function (event) { 
  		sJS.resetNewPostsBadge(0);
  		return false;
  	}
});

Template.post.helpers({
  formatdate: function (object) {
  	var diff = new Date().getTime() - object;
  	var m = Math.floor(diff / 1000 / 60);
  	var mm = m % 60;
  	var h = Math.floor(m / 60);
  	var hh = h % 60;
  	var dd = Math.floor(h / 24);

  	var str = "";
  	if(dd > 0) {
  		if(dd == 1) str += dd + " day ago";
  		else str += dd + " days ago";
  	}
  	else if(hh > 0) {
  		if(hh == 1) str += hh + " hour ago";
  		else str += hh + " hours ago";
  	}
  	else {
  		if(mm == 1) str += mm + " minute ago";
  		else str += mm + " minutes ago";
  	}
    return str;
  }
});

// PAGE _________________________________________________

Template.page.events(sJS.okCancelEvents(
	'#new-smark',
	{
	  ok: function (text, evt) {
	  	var username;
	  	if(Meteor.user().profile) username = Meteor.user().profile.name;
	  	else if(Meteor.user().username) username = Meteor.user().username;
	  	else username = "anonymous";

		Smarks.insert({
		  avatar: username,
		  smark: text,
		  owner: Meteor.userId(),
		  timestamp:new Date().getTime()
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
					maxHeight: '260px'
				}, function(oembed, dict){
	   				switch(oembed.type)
					{
						case "photo":
							$(node).append('<div class="embedly"><img src="' + oembed.url + '" width="'+oembed.width+'" height="'+oembed.height+'"/></div>');
							break;
						case "link":
							if(oembed.thumbnail_url) {
								$(node).append('<div class="embedly"><img src="' + oembed.thumbnail_url + '" width="'+oembed.thumbnail_width+'" height="'+oembed.thumbnail_height+'"/></div>'); 	
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
				}
			);
		}
  	}).addClass("linkified");
  	sJS.repositionPosts();
};

// _________________________________________________________________________

Meteor.startup(function () {
	$(window).resize(sJS.repositionPosts);
});


