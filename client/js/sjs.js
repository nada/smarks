 var sJS = (function ($) {

	var BOX_WIDTH = 280;
	var BOX_OFFSET = 20;

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
		  if (evt.type === "keydown" && evt.which === 27 ||
					 evt.type === "focusout") {
			// escape = cancel
			cancel.call(this, evt);

		  } else if (evt.type === "keyup" && evt.which === 13) {
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
		$('.btn.fav-only').css('left', ((postCols * (BOX_WIDTH + BOX_OFFSET)) - (2 * $('.btn.fav-only').width())) + "px").show();
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
		text = text.replace(exp,"<a class='link' target='blank' href='$1'>$1</a>");
		return {urls:urls, text:text}; 
	};

	timeSince = function(timestamp) {
		var diff = new Date().getTime() - timestamp;
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
	};

	getEmbedly = function(smarktext, _id)
	{
		var res = linkify(smarktext);
		if(res.urls !== null)
		{
			console.log("trying to get embedly for ", smarktext, _id);
			urls = res.urls.join(",");
			Meteor.http.get('http://api.embed.ly/1/oembed?urls=' + urls,
				{
					params: {
						"key":"f8fe34981bf2459e850c443dd1e587b7",
						"maxWidth": "260px", 
						"maxHeight": "260px"
					}
				},
				function(error, result)
				{
					if(error === null)
					{
						var embedly = [];
						var json = $.parseJSON(result.content);
						for(i in json)
						{
							var o = {};
							o.title = json[i].title;
							o.url = json[i].url;
							o.thumb = {
								url:json[i].thumbnail_url,
								width:json[i].thumbnail_width,
								height:json[i].thumbnail_height
							}
							embedly.push(o);
						}
						//write to smark
						
						Smarks.update(
							{
				  				_id:_id,
							}, {
					  			$set:{embedly:embedly}
					  		}
					  	);
					}
				}
			);
		}
	}

	// ---------------------------------------------------------------------
    //public api
    return {
    	okCancelEvents: function(selector, callbacks) { return okCancelEvents(selector, callbacks); },
    	activateInput: function(input) { activateInput(input); },
    	repositionPosts: function(event) { repositionPosts(event); },
    	resetNewPostsBadge: function(increment) { resetNewPostsBadge(increment); },
    	updateTitle: function(n) { updateTitle(n); },
    	linkify: function(text) { return linkify(text); },
    	timeSince: function(timestamp) { return timeSince(timestamp); },
    	getEmbedly: function(smarktext, _id) { getEmbedly(smarktext, _id); }
    	/*showTaggingSystem: function(node, tagarray) { showTaggingSystem(node, tagarray); }*/
    };

})($);
