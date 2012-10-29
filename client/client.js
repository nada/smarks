var sJS = (function ($) {

	var BOX_WIDTH = 300;
	var BOX_OFFSET = 10;

	var numOfPosts = 0;
	var firstRun = true;
	var newPosts = 0;

	// Returns an event map that handles the "escape" and "return" keys and
	// "blur" events on a text input (given by selector) and interprets them
	// as "ok" or "cancel".
	okCancelEvents = function (selector, callbacks) {
	  var ok = callbacks.ok || function () {};
	  var cancel = callbacks.cancel || function () {};

	  var events = {};
	  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
		function (evt) {
		  if (evt.type === "keydown" && evt.which === 27) {
			// escape = cancel
			cancel.call(this, evt);

		  } else if (evt.type === "keyup" && evt.which === 13 ||
					 evt.type === "focusout") {
			// blur/return/enter = ok/submit if non-empty
			var value = String(evt.target.value || "");
			if (value)
			  ok.call(this, value, evt);
			else
			  cancel.call(this, evt);
		  }
		};
	  return events;
	};

	activateInput = function (input) {
  		input.focus();
  		input.select();
	};

	repositionPosts = function(event) {
		//calculate new posts
		var postCols = Math.floor(($('.timeline').width() + BOX_OFFSET) / (BOX_WIDTH + BOX_OFFSET));
		var postRowPointer = new Array(postCols);
		for(var i = 0; i < postCols; i++)
		{
			postRowPointer[i] = 0;
		}
		//loop through posts and reposition em.
		$('.timeline .box.smark:visible').each(function(){
			//get the lowest rowpointer
			var min = Math.min.apply(Math, postRowPointer);
			//get fist appearence of min
			for(var j = 0; j < postCols; j++)
			{
				if(postRowPointer[j] == min)
				{
					$(this).css('left', (j * (BOX_WIDTH + BOX_OFFSET)) + "px");
					$(this).css('top', postRowPointer[j] + "px");
					postRowPointer[j] = $(this).position().top + $(this).height() + BOX_OFFSET;
					break;
				}
			}
		});
		var max = Math.max.apply(Math, postRowPointer);
		$(".page").css('height', ($('.timeline').position().top + max + 60) + "px");
		
		//fav-only button
		$('.btn.fav-only').css('left', ((postCols * (BOX_WIDTH + BOX_OFFSET)) + BOX_OFFSET - (2 * $('.btn.fav-only').width())) + "px").show();
	};

	resetNewPostsBadge = function(increment)
	{
		increment = increment || 0;
		numOfPosts += increment;
		newPosts = 0;
		updateTitle(numOfPosts);
	};

	updateTitle = function(n)
	{
		if(firstRun)
		{
			numOfPosts = n;
			firstRun = false;
		}
		newPosts = n - numOfPosts;
		if(newPosts) $('title').text('['+newPosts+'] smarks!');
		else $('title').text('smarks!');
	};

	linkify = function(text) {
		var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
		urls = text.match(exp);
		text = text.replace(exp,"<a class='link' href='$1'>$1</a>");
		return {urls:urls, text:text}; 
	}

	// ---------------------------------------------------------------------
    //public api
    return {
    	okCancelEvents: function(selector, callbacks) { return okCancelEvents(selector, callbacks); },
    	activateInput: function(input) { activateInput(input); },
    	repositionPosts: function(event) { repositionPosts(event); },
    	resetNewPostsBadge: function(increment) { resetNewPostsBadge(increment); },
    	updateTitle: function(n) { updateTitle(n); },
    	linkify: function(text) { return linkify(text); }
    };

})($);

// ----------------main

Meteor.startup(function () {
	Meteor.subscribe("smarks");
	Meteor.subscribe("favs");
	$(window).resize(sJS.repositionPosts);
});


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
}

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
}

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
}


