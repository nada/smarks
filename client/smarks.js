////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
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

var activateInput = function (input) {
  input.focus();
  input.select();
};

// ----------------main


Meteor.subscribe("smarks");


Template.timeline.posts = function() {
  return Smarks.find({}, {sort: {timestamp:-1}});
};


Template.page.events(okCancelEvents(
'#new-smark',
{
  ok: function (text, evt) {

	Smarks.insert({
	  avatar: Meteor.user().profile.name,
	  smark: text,
	  owner: Meteor.userId(),
	  timestamp:new Date().getTime()
	});

	evt.target.value = '';
  }
}));

var linkify = function(text) {
	var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
	return text.replace(exp,"<a href='$1'>$1</a>"); 
}

Template.page.rendered = function () {
  $('.smark').each(function(){
	$(this).html(linkify($(this).text()));
  });
  $('div.smark').not('.embedlied').embedly({
	maxWidth: '300px',
	maxHeight: '200px',
	wmode: 'transparent',
	method: 'afterParent',
	chars: 100,
	className : "embedly span5 offset2",
	key: 'f8fe34981bf2459e850c443dd1e587b7'
  }).addClass("embedlied");
}


/*
var filterURLsFrom = function (smarktext)
{
  var urlRegEx = /(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/gi;
  var res = smarktext.search(urlRegEx);
  res = "hello";
  return res;
};
*/

/* embedly */
/*
Template.post.rendered = function () {
  //var res = filterURLsFrom(this.smark);
  console.log(res);
  
  $('div.smark').embedly({
	maxWidth: '300px',
	maxHeight: '200px',
	wmode: 'transparent',
	method: 'after',
	chars: 100,
	key: 'f8fe34981bf2459e850c443dd1e587b7'
  });

}
*/


