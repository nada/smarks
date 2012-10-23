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


if (Meteor.isClient) {
  

/*
  Template.welcome.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });
*/

  Template.timeline.posts = function() {
    return Smarks.find({}, {sort: {timestamp:-1}});
  };


  Template.page.events(okCancelEvents(
  '#new-smark',
  {
    ok: function (text, evt) {
      /*
      console.log(text);
      console.log(evt);
      console.log(Meteor.user());
      console.log(Meteor.userId());
      */
console.log(Meteor.user().profile);

      Smarks.insert({
        avatar: Meteor.user().profile.name,
        smark: text,
        owner: Meteor.userId(),
        timestamp:new Date().getTime()
      });
  
      evt.target.value = '';
    }
  }));


}





